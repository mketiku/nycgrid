#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runMain } from "@mketiku/hook-checks/runner";

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
        (f) => f.startsWith(base) && /\.(test|spec)\.(ts|tsx|js|jsx|mjs)$/.test(f),
      );

    if (!testExists) missing.push(file);
  }
  return missing;
}

export const stepsByMode = {
  "pre-commit": [
    {
      label: "input-font-size",
      fn(context) {
        const { execFileSync: exec = execFileSync, stderr = process.stderr } = context;

        const stagedFiles = exec(
          "git",
          ["diff", "--cached", "--name-only", "--diff-filter=ACM"],
          { encoding: "utf8" },
        )
          .trim()
          .split("\n")
          .filter(Boolean);

        const violations = findSmallFontInputViolations(stagedFiles);
        if (violations.length > 0) {
          stderr.write(
            "\n✖ input-font-size: iOS Safari auto-zooms inputs < 16px.\n" +
              "  Use text-base or larger on <input>, <textarea>, <select>.\n",
          );
          for (const v of violations) stderr.write(`  ${v.file}:${v.line}\n`);
          throw new Error("input-font-size check failed");
        }
      },
    },
    {
      label: "new-source-needs-test",
      fn(context) {
        const { execFileSync: exec = execFileSync, stderr = process.stderr, env = process.env } =
          context;

        if (env.SKIP_TEST_REQUIRED) return;

        const addedFiles = exec(
          "git",
          ["diff", "--cached", "--name-only", "--diff-filter=A"],
          { encoding: "utf8" },
        )
          .trim()
          .split("\n")
          .filter(Boolean);

        const stagedFiles = exec(
          "git",
          ["diff", "--cached", "--name-only", "--diff-filter=ACM"],
          { encoding: "utf8" },
        )
          .trim()
          .split("\n")
          .filter(Boolean);

        const missing = findNewSourceWithoutTest(addedFiles, stagedFiles);
        if (missing.length > 0) {
          stderr.write("\n✖ new-source-needs-test: new files added without a test:\n");
          for (const f of missing) stderr.write(`  ${f}\n`);
          stderr.write(
            "\n  Add a co-located *.test.ts(x) file, or set SKIP_TEST_REQUIRED=1 to bypass.\n",
          );
          throw new Error("new-source-needs-test check failed");
        }
      },
    },
    { label: "lint-staged", command: "bunx", args: ["lint-staged"] },
    { label: "unit tests", command: "bun", args: ["run", "test:unit"] },
  ],
  "pre-push": [
    [
      { label: "lint", command: "bun", args: ["run", "lint"] },
      { label: "typecheck", command: "bun", args: ["run", "typecheck"] },
    ],
    {
      label: "react-doctor",
      fn(context) {
        const { execFileSync: exec = execFileSync, stdout = process.stdout } = context;

        let fetched = true;
        try {
          exec("git", ["fetch", "--no-write-fetch-head", "--no-tags", "origin", "main"], {
            stdio: "ignore",
          });
        } catch {
          stdout.write("  ⚠ react-doctor (skipped — origin/main unavailable)\n");
          fetched = false;
        }

        if (!fetched) return;

        exec(
          "bun",
          ["run", "doctor", "--diff", "origin/main", "--no-telemetry", "--fail-on", "error"],
          { stdio: "inherit" },
        );
      },
    },
    { label: "test + coverage", command: "bun", args: ["run", "test:coverage"] },
  ],
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runMain(stepsByMode, { logDirPrefix: "nycgrid-hooks-" }).catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  });
}
