Review recently changed code for quality, reuse, and efficiency — then fix any issues found.

## Instructions

1. Run `git diff HEAD` (or `git diff main...HEAD` for the full branch) to identify all changed files.
2. Read each changed file and evaluate against the project's standards:

### What to look for

**Duplication & reuse**

- Map layer logic duplicated across features
- Inline `fetch` calls that could use an existing lib helper
- Turf.js operations repeated instead of extracted into `src/lib/geo/`

**Code quality**

- `console.log`, `console.warn`, or `console.error` left in production code — remove them
- `any` types — replace with named interfaces or `unknown` + type guard
- `useMemo` / `useCallback` added without a proven re-render loop

**Correctness**

- MapLibre layer added without a corresponding `removeLayer` cleanup in useEffect return
- Missing null-check on camera feed URLs before rendering
- TanStack Query `queryFn` returning `undefined` instead of `null` or `[]`

**Structure**

- Feature code reaching into another feature's internals (violates feature isolation)
- Helpers or abstractions created for one-time use — inline instead
- Speculative complexity beyond what the task required
- New component without a colocated test file

3. Fix all issues found. Preserve behavior — this is cleanup, not a rewrite.
4. Run `bun run lint` and `bun run typecheck` to confirm no regressions.
5. Run `bun run test:unit` to confirm no test breakage.
6. Summarize what was changed and why.
