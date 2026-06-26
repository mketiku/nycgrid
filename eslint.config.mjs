import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";
import noStoreGetStateInRender from "./eslint-rules/no-store-getstate-in-render.js";
import noUnguardedNotification from "./eslint-rules/no-unguarded-notification.js";

const localRules = {
  plugins: {
    local: {
      rules: {
        "no-store-getstate-in-render": noStoreGetStateInRender,
        "no-unguarded-notification": noUnguardedNotification,
      },
    },
  },
  rules: {
    "local/no-store-getstate-in-render": "error",
    "local/no-unguarded-notification": "error",
  },
};

const eslintConfig = defineConfig([
  { ignores: [".claude/**", ".next/**", ".claude/worktrees/**", ".worktrees/**"] },
  ...nextVitals,
  ...nextTs,
  eslintConfigPrettier,
  {
    settings: {
      react: { version: "19" },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  localRules,
  {
    files: ["scripts/**/*.mjs", "scripts/**/*.js", "scripts/**/*.ts"],
    rules: { "no-console": "off" },
  },
]);

export default eslintConfig;
