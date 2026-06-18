#!/usr/bin/env node
import {
  existsSync,
  chmodSync,
  mkdirSync,
  renameSync,
  rmSync,
  mkdtempSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir, platform, arch } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

export function getDownloadUrl(version, osPlatform, osArch) {
  const platformMap = { darwin: "darwin", linux: "linux" };
  const archMap = { x64: "amd64", arm64: "arm64" };
  const goos = platformMap[osPlatform];
  const goarch = archMap[osArch];

  if (!goos || !goarch) return null;

  const tarball = `actionlint_${version}_${goos}_${goarch}.tar.gz`;
  return `https://github.com/rhysd/actionlint/releases/download/v${version}/${tarball}`;
}

export async function install({
  env = process.env,
  fetch = globalThis.fetch,
  os = { platform, arch },
  fs = { existsSync, chmodSync, mkdirSync, renameSync, rmSync, mkdtempSync },
  spawnSync = defaultSpawnSync,
  log = console.log,
  warn = console.warn,
  error = console.error,
  exit = process.exit,
  urlHelper = { fileURLToPath },
} = {}) {
  if (env.CI || env.VERCEL || env.SKIP_ACTIONLINT_INSTALL === "1") {
    exit(0);
    return;
  }

  const repoRoot = dirname(dirname(urlHelper.fileURLToPath(import.meta.url)));
  const binDir = join(repoRoot, "node_modules", ".bin");
  const target = join(binDir, "actionlint");

  if (fs.existsSync(target)) {
    exit(0);
    return;
  }

  const res = await fetch(
    "https://api.github.com/repos/rhysd/actionlint/releases/latest",
  );
  const VERSION = (await res.json()).tag_name.replace(/^v/, "");

  const url = getDownloadUrl(VERSION, os.platform(), os.arch());

  if (!url) {
    warn(
      `[install-actionlint] Unsupported platform ${os.platform()}/${os.arch()} — skipping. Install manually: brew install actionlint`,
    );
    exit(0);
    return;
  }

  const work = fs.mkdtempSync(join(tmpdir(), "actionlint-"));
  try {
    const dl = spawnSync(
      "sh",
      ["-c", `curl -fsSL "${url}" | tar xz -C "${work}" actionlint`],
      { stdio: "inherit" },
    );
    if (dl.status !== 0) {
      warn(
        "[install-actionlint] Download failed — skipping. CI still enforces; locally run: brew install actionlint",
      );
      exit(0);
      return;
    }

    if (!fs.existsSync(binDir)) fs.mkdirSync(binDir, { recursive: true });
    fs.renameSync(join(work, "actionlint"), target);
    fs.chmodSync(target, 0o755);
    log(
      `[install-actionlint] installed actionlint v${VERSION} → node_modules/.bin/actionlint`,
    );
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

const defaultSpawnSync = spawnSync;

export async function runCli(opts = {}) {
  try {
    await install(opts);
  } catch (err) {
    console.error("[install-actionlint] Fatal:", err.message);
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runCli();
}
