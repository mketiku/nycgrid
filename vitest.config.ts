import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Three test projects so each test only pays for the infrastructure it needs.
 *
 * | Project     | Environment | MSW | When to use                        |
 * |-------------|-------------|-----|------------------------------------|
 * | unit        | node        | No  | Pure logic, vi.mock()-only tests   |
 * | component   | happy-dom   | No  | render / renderHook tests          |
 * | integration | happy-dom   | Yes | Tests calling server.use() for HTTP|
 */

const integrationFiles: string[] = [
  // Add integration test files here as the project grows
  // e.g. "src/lib/api/counts.test.ts"
  "src/app/api/map/citibike-cameras/route.test.ts",
  "src/features/coverage-gap/useCoverageLayer.test.ts",
  "src/lib/citibike/nearby-cameras.test.ts",
];

// Pure-logic lib tests inside feature directories — run in the unit project (no DOM needed)
const featureLibUnitGlobs = ["src/features/**/lib/*.test.ts"];

const componentGlobs = [
  "src/app/**/*.test.{ts,tsx}",
  "src/features/**/*.test.{ts,tsx}",
  "src/components/**/*.test.tsx",
  "src/hooks/*.test.ts",
];

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    projects: [
      {
        plugins: [react()],
        resolve: { tsconfigPaths: true },
        test: {
          name: "unit",
          environment: "node",
          // featureLibUnitGlobs is listed first so vitest sees them before the broad exclude kicks in
          include: [...featureLibUnitGlobs, "src/**/*.test.ts"],
          exclude: [
            ...integrationFiles,
            // Only exclude the non-lib feature tests (lib tests are handled by featureLibUnitGlobs above)
            "src/app/**/*.test.{ts,tsx}",
            "src/features/**/!(lib)/*.test.{ts,tsx}",
            "src/features/*.test.{ts,tsx}",
            "src/components/**/*.test.tsx",
            "src/hooks/*.test.ts",
          ],
        },
      },
      {
        plugins: [react()],
        resolve: { tsconfigPaths: true },
        test: {
          name: "component",
          environment: "happy-dom",
          include: componentGlobs,
          exclude: [...integrationFiles, ...featureLibUnitGlobs],
          setupFiles: ["src/test/setup.ts"],
        },
      },
      {
        plugins: [react()],
        resolve: { tsconfigPaths: true },
        test: {
          name: "integration",
          environment: "happy-dom",
          include: integrationFiles,
          setupFiles: ["src/test/msw-setup.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 75,
        statements: 85,
      },
      exclude: [
        "node_modules",
        ".next",
        "src/test",
        "**/*.config.*",
        "**/types/**",
        "scripts/**",
        "src/lib/cameras/data.ts",
        "src/lib/recommendations/data.ts",
        "src/features/coverage-gap/lib/cd-names.ts",
        "src/features/context/index.ts",
        "src/features/context/types.ts",
        "src/features/coverage-gap/index.ts",
        "src/features/coverage-gap/types.ts",
        "src/lib/podcast/types.ts",
        "src/app/opengraph-image.tsx",
        "src/app/shot/[token]/opengraph-image.tsx",
        "src/app/postcard/opengraph-image.tsx",
        "src/app/robots.ts",
      ],
    },
  },
});
