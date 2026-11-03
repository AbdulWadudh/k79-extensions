import { spawnSync } from "node:child_process";
import { createHash, createPublicKey } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const extensionRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(extensionRoot, ".output", "chrome-mv3");
const manifestPath = join(outputDir, "manifest.json");
const defaultKeyPath = join(extensionRoot, ".keys", "infisical.pem");

function findChrome(): string {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.CHROME_BIN,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    join(process.env.LOCALAPPDATA ?? "", "Google", "Chrome", "Application", "chrome.exe"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];

  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) return candidate;
  }

  for (const command of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
    const result = spawnSync(command, ["--version"], { stdio: "ignore" });
    if (result.status === 0) return command;
  }

  throw new Error("Chrome was not found. Set CHROME_PATH to a Chrome or Chromium executable.");
}

function readManifestVersion(): string {
  if (!existsSync(manifestPath)) {
    throw new Error(`Build output is missing: ${manifestPath}. Run bun run build first.`);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { version?: string };
  if (!manifest.version) throw new Error("The built manifest has no version.");
  return manifest.version;
}

function extensionIdFromKey(keyPath: string): string {
  const publicKey = createPublicKey(readFileSync(keyPath));
  const der = publicKey.export({ type: "spki", format: "der" });
  const digest = createHash("sha256").update(der).digest();
  return [...digest.subarray(0, 16)]
    .map((byte) => {
      const high = String.fromCharCode(97 + (byte >> 4));
      const low = String.fromCharCode(97 + (byte & 0x0f));
      return `${high}${low}`;
    })
    .join("");
}

function assertCrx3(path: string): void {
  const bytes = readFileSync(path);
  if (bytes.toString("ascii", 0, 4) !== "Cr24") {
    throw new Error(`Chrome did not produce a valid CRX file: ${path}`);
  }
  if (bytes.readUInt32LE(4) !== 3) {
    throw new Error(`Expected a CRX3 file, found CRX version ${bytes.readUInt32LE(4)}.`);
  }
}

const version = readManifestVersion();
const explicitKeyPath = process.env.CRX_KEY_PATH;
const keyPath = explicitKeyPath ? resolve(explicitKeyPath) : defaultKeyPath;

if (explicitKeyPath && !existsSync(keyPath)) {
  throw new Error(`CRX_KEY_PATH does not exist: ${keyPath}`);
}

const hasKey = existsSync(keyPath);
const chromePemPath = `${outputDir}.pem`;
const chromeCrxPath = `${outputDir}.crx`;
const finalCrxPath = join(extensionRoot, ".output", `k79infisical-${version}-chrome.crx`);
const profileDir = join(tmpdir(), `k79-crx-${process.pid}-${Date.now()}`);

rmSync(chromeCrxPath, { force: true });
rmSync(chromePemPath, { force: true });
rmSync(finalCrxPath, { force: true });

const chrome = findChrome();
const args = [
  `--pack-extension=${outputDir}`,
  `--user-data-dir=${profileDir}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--no-message-box",
];
if (hasKey) args.push(`--pack-extension-key=${keyPath}`);

try {
  const result = spawnSync(chrome, args, { stdio: "inherit", timeout: 60_000 });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Chrome exited with code ${result.status ?? "unknown"}.`);
  }

  if (!hasKey) {
    if (!existsSync(chromePemPath)) {
      throw new Error("Chrome packed the extension but did not create a private key.");
    }
    mkdirSync(dirname(keyPath), { recursive: true });
    renameSync(chromePemPath, keyPath);
  }

  if (!existsSync(chromeCrxPath)) {
    throw new Error("Chrome did not create the CRX file.");
  }

  renameSync(chromeCrxPath, finalCrxPath);
  assertCrx3(finalCrxPath);

  console.log(`crx=${finalCrxPath}`);
  console.log(`crx_size=${statSync(finalCrxPath).size}`);
  console.log(`crx_extension_id=${extensionIdFromKey(keyPath)}`);
  console.log(`crx_key=${keyPath}${hasKey ? "" : " (generated; keep this private)"}`);
} finally {
  rmSync(chromePemPath, { force: true });
  try {
    rmSync(profileDir, { recursive: true, force: true });
  } catch {
    // Chrome can briefly hold a lock on its temporary profile. The next run uses a fresh one.
  }
}
