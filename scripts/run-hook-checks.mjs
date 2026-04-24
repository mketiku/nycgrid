#!/usr/bin/env node
/**
 * Orchestrates pre-commit and pre-push hook checks.
 * Usage: node scripts/run-hook-checks.mjs pre-commit | pre-push
 */

import { execSync } from "child_process";

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

if (stage === "pre-commit") {
  run("Lint staged files", "bunx lint-staged");
  run("Unit tests", "bun run test:unit");
}

if (stage === "pre-push") {
  run("Lint", "bun run lint");
  run("Typecheck", "bun run typecheck");
  run("Full test suite + coverage", "bun run test:coverage");
}

console.log(`\n✅ All ${stage} checks passed.`);
