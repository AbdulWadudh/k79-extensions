import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { type BrowserContext, chromium, expect, test } from "@playwright/test";

const extensionPath = join(process.cwd(), "extensions/infisical/.output/chrome-mv3");

async function launchExtension(): Promise<{
  context: BrowserContext;
  extensionId: string;
  profilePath: string;
}> {
  const profilePath = await mkdtemp(join(tmpdir(), "k79-e2e-"));
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

  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent("serviceworker", { timeout: 15_000 });
  return { context, extensionId: new URL(worker.url()).host, profilePath };
}

test("loads the onboarding surface without serious accessibility issues", async () => {
  const { context, extensionId, profilePath } = await launchExtension();

  try {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
    await expect(page.getByRole("heading", { name: "Connect your instance" })).toBeVisible();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        document.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
      );
    });

    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );
    expect(blocking).toEqual([]);
  } finally {
    await context.close();
    await rm(profilePath, { recursive: true, force: true });
  }
});

test("loads the disconnected popup", async () => {
  const { context, extensionId, profilePath } = await launchExtension();

  try {
    const page = await context.newPage();
    await page.setViewportSize({ width: 380, height: 520 });
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(page.getByRole("heading", { name: "Connect your instance" })).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(380);
  } finally {
    await context.close();
    await rm(profilePath, { recursive: true, force: true });
  }
});
