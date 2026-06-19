#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const _require = createRequire(import.meta.url);
const localTsc = join(_require.resolve("typescript"), "../../bin/tsc");

export function generateBuildInfoPath(id = randomBytes(6).toString("hex")) {
  return join(tmpdir(), `typecheck-${id}.tsbuildinfo`);
}

export function runTypecheck(context = {}) {
  const {
    spawnSync = defaultSpawnSync,
    rmSync: rm = defaultRmSync,
    exit = process.exit,
    generatePath = generateBuildInfoPath,
    tscBin = localTsc,
  } = context;

  const buildInfoFile = generatePath();

  const result = spawnSync(
    tscBin,
    ["--noEmit", "--tsBuildInfoFile", buildInfoFile],
    { stdio: "inherit" },
  );

  rm(buildInfoFile, { force: true });
  exit(result.status ?? 1);
}

const defaultSpawnSync = spawnSync;
const defaultRmSync = rmSync;

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runTypecheck();
}
