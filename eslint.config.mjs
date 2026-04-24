import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";

const eslintConfig = defineConfig([
  { ignores: [".claude/**", ".next/**"] },
  ...nextVitals,
  ...nextTs,
  eslintPluginPrettier,
  {
    settings: {
      react: { version: "19" },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    files: ["scripts/**/*.mjs", "scripts/**/*.js"],
    rules: { "no-console": "off" },
  },
]);

export default eslintConfig;
