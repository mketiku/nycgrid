# Skill: CI & Vercel Build Skip Patterns

Use this skill when deciding whether to skip a GitHub Actions run, a Vercel build, or both — and how.

## When to Use

- Before committing docs, ADRs, translations, or config changes that don't affect the running app.
- When GitHub Actions minutes are running low (Hobby: 2,000/month).
- When a change would trigger a Vercel build that serves no purpose (e.g. a ROADMAP edit).
- When setting up a new project and wiring the Vercel Ignored Build Step for the first time.

## Two Mechanisms — They Are Independent

| Mechanism                        | What it skips                                           | How to trigger                                |
| -------------------------------- | ------------------------------------------------------- | --------------------------------------------- |
| `[skip ci]` in commit message    | GitHub Actions **and** Vercel (Vercel honours this tag) | Append to any commit message                  |
| Vercel Ignored Build Step script | Vercel only                                             | Path-based auto or `[skip vercel]` in message |

**Do not conflate them.** `[skip ci]` skips everything. The Ignored Build Step only skips Vercel.

## Decision Table

| Change type                               | Skip GitHub CI? | Skip Vercel? | Tag to use         |
| ----------------------------------------- | --------------- | ------------ | ------------------ |
| Docs, ADRs, ROADMAP                       | Yes             | Yes          | `[skip ci]`        |
| `messages/*.json` translation keys        | Yes             | Yes          | `[skip ci]`        |
| `scripts/` (local-only tooling)           | Yes             | Yes          | `[skip ci]`        |
| `.github/workflows/` only                 | No              | Yes          | `[skip vercel]`    |
| `src/worker/` or `wrangler.toml`          | No              | Yes          | `[skip vercel]`    |
| Warmup workflow YAML                      | No              | Yes          | `[skip vercel]`    |
| Any `src/`, `public/`, `supabase/` change | No              | No           | — build everything |

## `[skip ci]` Usage

Append the tag to the commit message subject line:

```
docs: update platform constraints [skip ci]
chore: add ADR 0043 [skip ci]
chore(i18n): sync yo translation keys [skip ci]
```

GitHub recognises `[skip ci]`, `[ci skip]`, `[no ci]`, and `[skip actions]` — all equivalent. Vercel also respects `[skip ci]`.

## Vercel Ignored Build Step

Paste this script into **Project Settings → Git → Ignored Build Step**. It runs before every Vercel build; exit `0` = skip, exit `1` = build.

```bash
#!/bin/bash
# Exit 0 = skip build. Exit 1 = proceed with build.

COMMIT_MSG=$(git log -1 --pretty=%B)

# Manual escape hatch — [skip vercel] in commit message
if echo "$COMMIT_MSG" | grep -qF "[skip vercel]"; then
  echo "Skipping: [skip vercel] tag found"
  exit 0
fi

# Always build on main when app code changed
if git diff HEAD^ HEAD --name-only | grep -qE \
  '^(src/|public/|supabase/migrations/|next\.config\.|tailwind\.config\.|postcss\.config\.|package\.json|bun\.lock|vercel\.json|vercel\.ts)'; then
  echo "Building: app code changed"
  exit 1
fi

echo "Skipping: no app code changed"
exit 0
```

### Paths that always build

- `src/` — app code, components, features, lib
- `public/` — static assets
- `supabase/migrations/` — schema changes (build triggers type regen)
- Config files: `next.config.*`, `tailwind.config.*`, `postcss.config.*`, `package.json`, `bun.lock`, `vercel.json`, `vercel.ts`

### Paths that are skip-safe (never trigger build alone)

- `.github/workflows/` — CI config only
- `src/worker/` + `wrangler.toml` — deployed via Workers action, not Vercel
- `docs/`, `*.md` (root), `ROADMAP.md`, `AGENTS.md`, `CLAUDE.md`
- `scripts/` — local tooling, not bundled
- `tests/` — not bundled; E2E runs separately
- `launch/` — marketing docs

## GitHub Actions Minutes Conservation

Scheduled workflows (cron) and `workflow_dispatch`-only workflows consume minutes but cannot be skipped via commit tags. To reduce consumption:

- Move lightweight health checks to `workflow_dispatch` + weekly cron rather than every PR.
- Use `if: github.event_name == 'push' && github.ref == 'refs/heads/main'` to gate expensive steps.
- Set `timeout-minutes` on every job — prevents runaway jobs from draining the budget.

## Warmup Workflow Patterns (for new projects)

When writing curl-based warmup workflows:

```bash
# Parallel execution (2 concurrent) with result collection
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT
PIDS=()
JOB=0

while IFS= read -r ITEM; do
  JOB=$((JOB + 1))
  (
    STATUS=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 30 \
      -H "User-Agent: GitHub-Actions/warmup (example.com)" \
      "https://example.com/api/warm?item=${ITEM}")
    echo "$STATUS" > "$TMPDIR/r_${JOB}"
    case "$STATUS" in
      200|404) ;;
      *) echo "⚠️  Failed: $ITEM — HTTP $STATUS" ;;
    esac
  ) &
  PIDS+=($!)

  if [ "${#PIDS[@]}" -ge 2 ]; then
    wait "${PIDS[0]}"
    PIDS=("${PIDS[@]:1}")
  fi
done < <(echo "$ITEMS" | jq -r '.[]')

wait "${PIDS[@]}" 2>/dev/null || true

SUCCESS=$(cat "$TMPDIR"/r_* 2>/dev/null | grep -c "^200$" || echo 0)
SKIPPED=$(cat "$TMPDIR"/r_* 2>/dev/null | grep -c "^404$" || echo 0)
TOTAL=$(ls "$TMPDIR"/r_* 2>/dev/null | wc -l | tr -d ' ' || echo 0)
FAILED=$((TOTAL - SUCCESS - SKIPPED))

# Fail the job if >25% of requests failed (429s, 500s, timeouts)
if [ "$FAILED" -gt "$((TOTAL / 4))" ]; then
  echo "❌ Failure rate exceeded 25% ($FAILED/$TOTAL)"
  exit 1
fi
```

Key decisions:

- `--max-time 30` is **seconds** (not minutes). Set conservatively — a cold render on Vercel Hobby takes ~5–10s.
- `SKIPPED` (404) is expected for names/items that don't exist — exclude from failure rate.
- 25% threshold: permissive enough for transient 429s, strict enough to catch Vercel being down.
- Don't exceed 2–3 parallel curl requests on Vercel Hobby — Function concurrency limit is low; more parallelism causes 429 cascades.
- Set `timeout-minutes` on the job (5–10 min max for warmups).
