#!/usr/bin/env node
/**
 * Orchestrates pre-commit and pre-push hook checks.
 * Usage: node scripts/run-hook-checks.mjs pre-commit | pre-push
 */

import { execSync, spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";

const stage = process.argv[2];

if (!stage || !["pre-commit", "pre-push"].includes(stage)) {
  console.error("Usage: node scripts/run-hook-checks.mjs pre-commit|pre-push");
  process.exit(1);
}

function run(label, cmd) {
  console.log(`\n▶ ${label}`);
  try {
    execSync(cmd, { stdio: "inherit" });
    console.log(`✓ ${label}`);
  } catch {
    console.error(`✗ ${label} failed`);
    process.exit(1);
  }
}

function getStagedFiles() {
  const result = spawnSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=ACM"],
    { encoding: "utf8" }
  );
  return result.stdout.trim().split("\n").filter(Boolean);
}

function getAddedSourceFiles() {
  const result = spawnSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=A"],
    { encoding: "utf8" }
  );
  return result.stdout.trim().split("\n").filter(Boolean);
}

// iOS Safari auto-zooms inputs smaller than 16px. Block commits that add
// text-xs/text-sm on input/textarea/select within an 8-line lookahead window.
export function findSmallFontInputViolations(stagedFiles) {
  const tsxFiles = stagedFiles.filter((f) => f.endsWith(".tsx"));
  const violations = [];
  for (const file of tsxFiles) {
    if (!existsSync(file)) continue;
    const lines = readFileSync(file, "utf8").split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (!/<(input|textarea|select)[\s>]/i.test(lines[i])) continue;
      const window = lines.slice(i, i + 8).join("\n");
      if (/\btext-xs\b|\btext-sm\b/.test(window)) {
        violations.push({ file, line: i + 1 });
      }
    }
  }
  return violations;
}

const APP_ROUTER_BOILERPLATE = new Set([
  "layout",
  "loading",
  "error",
  "not-found",
  "route",
  "template",
  "default",
  "global-error",
  "opengraph-image",
]);

// New src/ files must have a co-located test file.
// Bypass with SKIP_TEST_REQUIRED=1 for scaffolding commits.
export function findNewSourceWithoutTest(addedFiles, stagedFiles) {
  const missing = [];
  for (const file of addedFiles) {
    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(file)) continue;
    if (/\.(test|spec)\.(ts|tsx|js|jsx|mjs)$/.test(file)) continue;
    if (/\.d\.ts$/.test(file)) continue;
    if (/\.stories\.(ts|tsx)$/.test(file)) continue;
    if (!file.startsWith("src/")) continue;
    if (file.startsWith("src/types/") || file.startsWith("src/test/")) continue;

    const base = file.replace(/\.(ts|tsx|js|jsx|mjs)$/, "");
    const filename = base.split("/").pop() ?? "";
    if (APP_ROUTER_BOILERPLATE.has(filename)) continue;

    const testExists =
      existsSync(`${base}.test.ts`) ||
      existsSync(`${base}.test.tsx`) ||
      existsSync(`${base}.test.js`) ||
      stagedFiles.some(
        (f) => f.startsWith(base) && /\.(test|spec)\.(ts|tsx|js|jsx|mjs)$/.test(f)
      );

    if (!testExists) missing.push(file);
  }
  return missing;
}

if (stage === "pre-commit") {
  const stagedFiles = getStagedFiles();
  const addedFiles = getAddedSourceFiles();

  const fontViolations = findSmallFontInputViolations(stagedFiles);
  if (fontViolations.length > 0) {
    console.error("\n✗ input-font-size: iOS Safari auto-zooms inputs < 16px.");
    console.error("  Use text-base or larger on <input>, <textarea>, <select>.");
    for (const v of fontViolations) console.error(`  ${v.file}:${v.line}`);
    process.exit(1);
  }
  console.log("✓ input-font-size");

  if (!process.env.SKIP_TEST_REQUIRED) {
    const missing = findNewSourceWithoutTest(addedFiles, stagedFiles);
    if (missing.length > 0) {
      console.error("\n✗ new-source-needs-test: new files added without a test:");
      for (const f of missing) console.error(`  ${f}`);
      console.error(
        "\n  Add a co-located *.test.ts(x) file, or set SKIP_TEST_REQUIRED=1 to bypass."
      );
      process.exit(1);
    }
    console.log("✓ new-source-needs-test");
  }

  run("Lint staged files", "bunx lint-staged");
  run("Unit tests", "bun run test:unit");
}

if (stage === "pre-push") {
  run("Lint", "bun run lint");
  run("Typecheck", "bun run typecheck");
  run(
    "React Doctor",
    "bun run doctor --diff origin/main --no-telemetry --fail-on error"
  );
  run("Full test suite + coverage", "bun run test:coverage");
}

console.log(`\n✅ All ${stage} checks passed.`);
