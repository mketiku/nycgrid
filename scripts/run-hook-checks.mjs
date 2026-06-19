#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import { runMain } from "@mketiku/hook-checks/runner";
import { lintStep } from "@mketiku/hook-checks/steps/lint";
import { typecheckStep } from "@mketiku/hook-checks/steps/typecheck";
import { createNewSourceNeedsTestStep } from "@mketiku/hook-checks/steps/tdd";
import { findSmallFontInputViolations, inputFontSizeStep } from "@mketiku/hook-checks/steps/ui";
import { createReactDoctorStep } from "@mketiku/hook-checks/steps/nextjs";

export { findSmallFontInputViolations };

const newSourceNeedsTestStep = createNewSourceNeedsTestStep();

const reactDoctorStep = createReactDoctorStep({
  doctorArgs: ["--diff", "origin/main", "--no-telemetry", "--fail-on", "error"],
});

export const stepsByMode = {
  "pre-commit": [
    inputFontSizeStep,
    newSourceNeedsTestStep,
    { label: "lint-staged", command: "bunx", args: ["lint-staged"] },
    { label: "unit tests", command: "bun", args: ["run", "test:unit"] },
  ],
  "pre-push": [
    [lintStep, typecheckStep],
    reactDoctorStep,
    { label: "test + coverage", command: "bun", args: ["run", "test:coverage"] },
  ],
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runMain(stepsByMode, { logDirPrefix: "nycgrid-hooks-" }).catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  });
}
