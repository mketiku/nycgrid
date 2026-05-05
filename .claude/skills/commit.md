---
name: commit
description: Use before every git commit or push. Runs the quality gate (typecheck, lint, tests) and organizes conventional commits.
---

# Skill: Commit Workflow

Use this skill whenever you're about to commit and push changes.

## Steps

### 1. Typecheck

```bash
bun run typecheck
```

Fix all TypeScript errors before proceeding. Do not skip. `any` is a lint error in this repo.

### 2. Lint & format staged files

```bash
bunx lint-staged
```

### 3. Tests

```bash
bun run test:unit
```

If changes touch components or integration points, also run:

```bash
bun run test:component
bun run test:integration
```

### 4. Organize commits

Group changes into logical conventional commits:

- `feat(scope): ...` — new functionality
- `fix(scope): ...` — bug fix
- `refactor(scope): ...` — restructuring
- `test(scope): ...` — test additions
- `chore(scope): ...` — tooling, config, deps
- `docs(scope): ...` — documentation only

### 5. Commit

```bash
git commit -m "$(cat <<'EOF'
type(scope): concise summary (7-14 words)
EOF
)"
```

### 6. Push

```bash
git push
```

### 7. Pull Request (when raising one)

```bash
gh pr create --draft --title "type(scope): summary" --body "$(cat <<'EOF'
## Summary
- ...

## Test plan
- [ ] ...
EOF
)"
```

**Rules:**

- Always `--draft`. Never open a ready-for-review PR directly.
- Never include `claude.ai/code/session_*` URLs anywhere in the PR.

## Rules

- Never use `--no-verify` unless the user explicitly asks.
- Never commit without running at least typecheck + lint + unit tests first.
- Append `[skip ci]` for docs/ADR/config-only commits.
- Subject: 7–14 words. Intent over mechanics — describe what changed and why.

## Project scopes

Short identifiers: `map`, `camera`, `photobooth`, `ui`, `hooks`, `lib`.

## Examples

- `feat(map): add coverage-gap overlay with borough boundaries`
- `fix(camera): handle missing feed URL gracefully in live view`
- `refactor(photobooth): extract strip layout into composable hook`
- `test(map): add coverage for turf intersection edge cases`
- `chore: update AGENTS.md with proxy.ts routing note [skip ci]`
