import assert from "node:assert/strict";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium, type Page } from "@playwright/test";

const extensionPath = join(process.cwd(), "extensions/infisical/.output/chrome-mv3");
const profilePath = join(
  process.env.TEMP ?? "C:\\Users\\KSeventy9\\AppData\\Local\\Temp",
  `k79-live-profile-${Date.now()}`,
);
const reviewDir = join(process.cwd(), ".impeccable/review");
const baseUrl = process.env.INFISICAL_BASE_URL ?? "https://us.infisical.com";
const clientId = process.env.INFISICAL_CLIENT_ID;
const clientSecret = process.env.INFISICAL_CLIENT_SECRET;
const smokeKey = `K79_SYNTHETIC_SMOKE_${Date.now()}`;
const smokeValue = `synthetic_do_not_use_${Date.now()}`;

if (!clientId || !clientSecret) {
  throw new Error("INFISICAL_CLIENT_ID and INFISICAL_CLIENT_SECRET are required in the local env.");
}

await mkdir(reviewDir, { recursive: true });

const context = await chromium.launchPersistentContext(profilePath, {
  headless: false,
  viewport: { width: 400, height: 850 },
  args: [
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
    "--no-first-run",
    "--no-default-browser-check",
  ],
});

const consoleErrors: string[] = [];
const pageErrors: string[] = [];

function track(page: Page) {
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
}

async function waitForSettled(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      document.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
    );
  });
  await page.waitForTimeout(100);
}

let projectId = "";
let environment = "";
let created = false;
let currentKey = smokeKey;

async function assertNoBlockingA11y(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );
  assert.deepEqual(blocking, [], `${label} has serious accessibility violations`);
  console.log(`a11y_${label}=passed`);
}

try {
  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent("serviceworker", { timeout: 15_000 });
  const extensionId = new URL(worker.url()).host;
  console.log(`extension_id=${extensionId}`);

  const page = await context.newPage();
  track(page);
  await page.setViewportSize({ width: 400, height: 850 });
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  await page.getByRole("heading", { name: "Connect your instance" }).waitFor();
  await waitForSettled(page);
  await page.screenshot({ path: join(reviewDir, "onboarding-400.png"), fullPage: true });

  await page.getByLabel("Client ID").fill(clientId);
  await page.getByLabel("Client Secret").fill(clientSecret);
  await page.getByRole("button", { name: /Connect and continue/ }).click();
  await page.getByRole("heading", { name: "Choose a scope" }).waitFor({ timeout: 45_000 });
  await waitForSettled(page);

  await page.getByLabel("Project").click();
  await page.getByRole("option").first().click();
  await page.waitForTimeout(300);

  const environmentTrigger = page.getByLabel("Environment");
  if (await environmentTrigger.isVisible()) {
    const current = await environmentTrigger.textContent();
    if (!current?.trim()) {
      await environmentTrigger.click();
      await page.getByRole("option").first().click();
    }
  }

  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("heading", { name: "Ready to work" }).waitFor({ timeout: 30_000 });
  await waitForSettled(page);
  await page.screenshot({ path: join(reviewDir, "ready-400.png"), fullPage: true });

  const prefs = await page.evaluate(async () => {
    const data = await chrome.storage.local.get(null);
    return data["k79.infisical.prefs.v1"] as
      | { projectId?: string; environment?: string }
      | undefined;
  });
  projectId = prefs?.projectId ?? "";
  environment = prefs?.environment ?? "";

  await page.getByRole("button", { name: /Open workspace/ }).click();
  await page.getByLabel("Filter secrets").waitFor({ timeout: 30_000 });
  await waitForSettled(page);
  await page.screenshot({ path: join(reviewDir, "workspace-400.png"), fullPage: true });
  await assertNoBlockingA11y(page, "workspace");

  const folderRow = page.locator("li").filter({ hasText: "LMS-BACKEND" }).first();
  const hasFolder = await folderRow
    .waitFor({ state: "visible", timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  if (hasFolder) {
    await folderRow.getByRole("button").first().click();
    await page.getByTitle("Change folder path").getByText("/LMS-BACKEND").waitFor();
    await page.getByRole("button", { name: "Go up one folder" }).click();
    await page.getByTitle("Change folder path").getByText("/", { exact: true }).waitFor();
    console.log("folder_navigation=passed");
  }

  const readOnly = await page.getByText(/cannot create, edit, or delete/).isVisible();
  if (readOnly) {
    console.log("read_only_identity=true");
  } else {
    await page.getByRole("button", { name: /New/ }).first().click();
    const keyInput = page.getByRole("textbox", { name: "Key", exact: true });
    await keyInput.fill(smokeKey.toLowerCase());
    assert.equal(await keyInput.inputValue(), smokeKey);
    await page.getByRole("textbox", { name: "Value", exact: true }).fill(smokeValue);
    await page
      .getByRole("textbox", { name: "Comment", exact: true })
      .fill("Synthetic UI smoke test. Safe to delete.");
    await page.getByRole("button", { name: "Create secret" }).click();
    await page.getByText(/Saved K79_SYNTHETIC_SMOKE_/).waitFor({ timeout: 30_000 });
    created = true;

    await page.getByRole("button", { name: "Close inspector" }).click();
    const syntheticRow = page.locator("li").filter({ hasText: smokeKey }).first();
    await syntheticRow.getByRole("button", { name: "Reveal secret value" }).click();
    await syntheticRow.getByText(smokeValue).waitFor({ timeout: 30_000 });
    assert.equal(await page.getByText("Inspector").isVisible(), false);

    await syntheticRow.getByRole("button", { name: "Conceal secret value" }).click();
    assert.equal(await syntheticRow.getByText(smokeValue).isVisible(), false);
    await syntheticRow.getByRole("button", { name: "Reveal secret value" }).click();
    await syntheticRow.getByText(smokeValue).waitFor({ timeout: 30_000 });
    await page.getByRole("button", { name: "Conceal all revealed values" }).click();
    assert.equal(await syntheticRow.getByText(smokeValue).isVisible(), false);

    await syntheticRow.getByRole("button").first().click();
    await page.getByText(`Copied ${smokeKey}`).waitFor({ timeout: 10_000 });
    await syntheticRow.getByRole("button", { name: "View details" }).click();
    await page.getByRole("button", { name: "Reveal value" }).click();
    await page.getByText(smokeValue).waitFor({ timeout: 30_000 });
    await waitForSettled(page);
    await page.screenshot({ path: join(reviewDir, "secret-detail-400.png"), fullPage: true });
    await assertNoBlockingA11y(page, "detail");

    await page.getByRole("button", { name: "Copy value" }).click();
    await page.getByText(`Copied ${smokeKey}`).waitFor({ timeout: 10_000 });

    const renamedKey = `${smokeKey}_RENAMED`;
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await page.getByRole("textbox", { name: "Key", exact: true }).fill(renamedKey);
    await page
      .getByRole("textbox", { name: "Comment", exact: true })
      .fill("Synthetic UI smoke test, edited and renamed. Safe to delete.");
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.getByText(`Saved ${renamedKey}`).waitFor({ timeout: 30_000 });
    currentKey = renamedKey;

    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Delete secret" }).click();
    await page.getByText(`Deleted ${currentKey}`).waitFor({ timeout: 30_000 });
    created = false;
    await page.waitForTimeout(2_800);
  }

  const storageLeak = await page.evaluate(async (needle) => {
    const local = await chrome.storage.local.get(null);
    const session = await chrome.storage.session.get(null);
    return JSON.stringify({ local, session }).includes(needle);
  }, smokeValue);
  if (storageLeak) throw new Error("The synthetic secret value leaked into extension storage.");
  console.log("storage_leak=false");

  await page.setViewportSize({ width: 360, height: 850 });
  await waitForSettled(page);
  await page.screenshot({ path: join(reviewDir, "workspace-360.png"), fullPage: true });

  await page.setViewportSize({ width: 800, height: 850 });
  await waitForSettled(page);
  await page.screenshot({ path: join(reviewDir, "workspace-800.png"), fullPage: true });

  const popup = await context.newPage();
  track(popup);
  await popup.setViewportSize({ width: 380, height: 560 });
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.getByLabel("Filter secrets").waitFor({ timeout: 30_000 });
  await popup.getByRole("button", { name: "Open side panel" }).waitFor();
  await popup.waitForTimeout(800);
  await waitForSettled(popup);
  await popup.screenshot({ path: join(reviewDir, "popup-380.png"), fullPage: true });

  if (consoleErrors.length > 0) {
    throw new Error(`Console errors:\n${consoleErrors.join("\n")}`);
  }
  if (pageErrors.length > 0) {
    throw new Error(`Page errors:\n${pageErrors.join("\n")}`);
  }

  console.log("ui_check=passed");
} finally {
  if (created && projectId && environment) {
    try {
      const auth = await fetch(`${baseUrl}/api/v1/auth/universal-auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret }),
      });
      const token = (await auth.json()) as { accessToken?: string };
      if (token.accessToken) {
        await fetch(`${baseUrl}/api/v4/secrets/${encodeURIComponent(currentKey)}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId,
            environment,
            secretPath: "/",
            type: "shared",
          }),
        });
        console.log("cleanup=attempted");
      }
    } catch {
      console.log("cleanup=failed");
    }
  }

  await context.close();
  await rm(profilePath, { recursive: true, force: true });
}
