# Skill: Validation & Hook Debugging

Use this skill for proactive pre-commit/pre-push validation, or to diagnose a Husky hook failure.

## Proactive Validation

```bash
# Pre-commit checks (lint staged files + unit tests)
node scripts/run-hook-checks.mjs pre-commit

# Pre-push checks (lint + typecheck + coverage)
node scripts/run-hook-checks.mjs pre-push
```

## Diagnosing a Failure

```bash
# 1. Lint
bun run lint

# 2. Type check
bun run typecheck

# 3. Tests — narrowest tier first
bun run test:unit
bun run test:component
bun run test:integration
bun run test:coverage    # full suite + thresholds
```

## Escalation

| Failure      | Fix                                |
| ------------ | ---------------------------------- |
| Lint/format  | `bun run lint -- --fix`            |
| Type error   | Fix the code                       |
| Test failure | Fix the code — never weaken a test |

Bypassing hooks with `--no-verify` requires explicit user consent.
