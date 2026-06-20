# Skill: TDD Workflow (Red-Green-Refactor)

Use this skill for every new implementation, feature enhancement, or bug fix.

## When to Use

- When starting a new feature or sub-component
- When fixing a bug (requires a regression test)
- When refactoring existing logic to ensure behavior is preserved

## Do Not Use

- For trivial documentation-only changes
- For purely aesthetic CSS tweaks that don't affect logic/accessibility

## Workflow

### 1. Preparation & Mocking

- **Mock First**: If your feature touches the NYC DOT API or another external service, add/update MSW handlers in `src/test/msw-handlers.ts`.
- **TanStack Query Safety**: Ensure any new `queryFn` provides a non-undefined fallback (`?? null`, `?? []`).

### 2. RED: Write a Failing Test

Define expected behavior before writing production code.

- **Location**: Place tests next to the source (`MyComponent.tsx` → `MyComponent.test.tsx`).
- **Bug Fixes**: Write a "Regression Test" reproducing the bug. Document the scenario in a comment.
- **Choose the right tier**:

  ```bash
  # Pure logic (no DOM, no MSW)
  bunx vitest run --project unit src/lib/myModule.test.ts

  # Component rendering / hooks
  bunx vitest run --project component src/features/my/Component.test.tsx

  # API tests using MSW
  bunx vitest run --project integration src/lib/api/myApi.test.ts
  ```

- **Confirm failure**: Ensure the test fails for the right reason.

### 3. GREEN: Minimum Implementation

Write the simplest code possible to make the test pass.

- **Run the same test command from step 2 — confirm it passes.**

### 4. REFACTOR: Clean & Polish

```bash
bun run lint -- --fix
bun run typecheck
```

Remove all `console.log` statements.

### 5. Final Verification

```bash
bunx vitest run   # all tiers — must pass
bun run build     # production build — must succeed
```

## Test Tier Placement

| Your test needs...                               | Tier            | Action needed                                   |
| ------------------------------------------------ | --------------- | ----------------------------------------------- |
| Nothing (pure logic, vi.mock)                    | **unit**        | None — default catch-all                        |
| `render`, `renderHook`, `window`, `localStorage` | **component**   | Add to `componentGlobs` in `vitest.config.ts`   |
| `server.use()` for HTTP mocking                  | **integration** | Add to `integrationFiles` in `vitest.config.ts` |
