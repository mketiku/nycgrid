# /standup

Morning standup: parallel health sweep across code, docs, platform, and debt — then synthesise a `PLAN_OF_DAY.md` with the top 3 highest-leverage tasks for today.

Run this every morning before starting work. It takes ~2–3 minutes.

---

## Context

Project: **NycGrid** — NYC traffic camera explorer. Next.js 16, React 19, TypeScript, MapLibre GL, Vercel Hobby. **Phase 1 (Browse & Shoot) is shipped.** Currently building toward Phase 2 (Civic Layers). Platform constraints and API usage rules are in `docs/context/platform-constraints.md` — these are non-negotiable.

**Bias note:** The goal is leverage, not busywork. API rate limit violations or data policy issues (NYC DOT agreement) take absolute priority over any feature work. Phase 2 gate items outrank polish.

---

## Step 1 — Resolve today's date

```bash
date "+%Y-%m-%d"
```

Store as `TODAY`.

---

## Step 2 — Dispatch all five scouts in parallel

Spawn all five agents simultaneously. Do not wait for one before starting the next.

---

### Scout A — Roadmap & Phase 2 gate drift

**Role:** Read ROADMAP.md and verify each Phase 2 item against actual code state. Flag drift in either direction. Also check legal/ops items.

**Prompt:**

```
You are doing a drift audit for NycGrid (Next.js 16, NYC traffic camera explorer, Phase 1 shipped).

Read ROADMAP.md in full.

Then check the code/filesystem to verify:
1. Phase 1 items — are they actually shipped? Flag "marked done but incomplete".
2. Phase 2 items — has any shipped early? Flag "shipped but not noted in ROADMAP".
3. Legal & Operations items — specifically the NYC DOT data-sharing agreement — what is its current status?

For each finding output:
- Item text (truncated to ~60 chars)
- Actual state: DONE | OPEN | DRIFT
- One-line evidence (file:line or "not found")

End with: "Phase 2 development is blocked by: ..."

Do not fix anything. Research only.
```

---

### Scout B — Platform health (Vercel, GitHub, external APIs)

**Role:** Check free-tier consumption, Dependabot alerts, and external API budget relative to limits in `docs/context/platform-constraints.md`.

**Prompt:**

```
You are a platform health monitor for NycGrid. The project runs on Vercel Hobby and calls multiple external APIs (NYC DOT, MTA, OpenWeatherMap, etc.).

Read docs/context/platform-constraints.md in full to understand all hard limits and responsible-use rules.

Then perform the following checks:

**GitHub — Dependabot / security:**
Run:
  gh api repos/$(gh repo view --json nameWithOwner -q .nameWithOwner)/dependabot/alerts --paginate -q '[.[] | select(.state=="open")] | length'
  gh api repos/$(gh repo view --json nameWithOwner -q .nameWithOwner)/dependabot/alerts --paginate -q '[.[] | select(.state=="open")] | .[:5] | .[] | {severity:.security_advisory.severity, package:.dependency.package.name, summary:.security_advisory.summary}'

**Vercel — recent deployment + function errors:**
Run:
  vercel ls --limit 5 2>/dev/null || echo "vercel CLI not available"

**Local checks:**
  git log --oneline -10
  bunx tsc --noEmit 2>&1 | tail -20
  cat package.json | grep '"version"'

**API budget review:**
Read docs/context/platform-constraints.md and report:
- Each external API: documented call rate vs limit
- Any interval-based fetches in the codebase that are undocumented in platform-constraints
- Flag any call pattern that appears to violate the responsible-use rules

Output a health card:
  GitHub Dependabot: N open alerts (highest severity: X)
  Vercel: last deploy STATUS, N ago
  TypeScript: CLEAN | N errors
  API budget: [each API — rate vs limit, any violations]

Flag anything approaching a limit or violating responsible-use rules. Do not fix anything. Research only.
```

---

### Scout C — Docs drift (undocumented features and API calls)

**Role:** Diff the last 7 days of commits against docs. Flag features that shipped without docs, and any new API calls not documented in platform-constraints.md.

**Prompt:**

```
You are a docs-drift detector for NycGrid.

Step 1 — find recent commits:
  git log --oneline --since="7 days ago"

Step 2 — for each commit that adds/changes significant feature code (not test-only, not chore), check:
  a) Is the feature or Phase noted in ROADMAP.md?
  b) Are any new external API calls documented with their rate/cost in docs/context/platform-constraints.md?

Step 3 — flag each gap:
  commit: <sha> <message>
  feature: <what it does in one line>
  missing: ROADMAP note | API cost documented | all fine

Be conservative — only flag genuine feature additions, not refactors or bug fixes.

Do not fix anything. Research only.
```

---

### Scout D — TODO/FIXME/HACK staleness

**Role:** Scan all source comments and classify them: stale, active, or critical.

**Prompt:**

```
You are a technical debt scanner for NycGrid.

Run:
  grep -rn "TODO\|FIXME\|HACK\|XXX\|TEMP\|remove before\|REMOVE BEFORE" \
    --include="*.ts" --include="*.tsx" \
    --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=coverage \
    . | grep -v ".test." | grep -v ".spec."

For each result classify as:
- STALE: the condition it describes has already been resolved (check git log / code)
- ACTIVE: genuinely open work that has not been done
- CRITICAL: tagged "remove before launch" or related to the NYC DOT agreement / rate limiting / data policy

Output a table:
  file:line | type | text (truncated) | classification | evidence

Then output counts: N stale, N active, N critical.

Flag any CRITICAL items prominently — these are blockers.

Do not fix anything. Research only.
```

---

### Scout E — Vercel logs and build health (24h window)

**Role:** Pull recent Vercel logs and surface any anomalies, errors, or performance degradation in the last 24 hours.

**Prompt:**

```
You are a live-system health checker for NycGrid (no Supabase — all data from external APIs).

**Vercel logs:**
Run:
  vercel logs --limit 100 2>/dev/null | grep -E "error|Error|500|502|timeout|rate.limit|429" | head -30
If vercel CLI not available: note "Vercel logs: check dashboard".

**Build and test health:**
Run:
  bun run typecheck 2>&1 | tail -20
  bun run test:run 2>&1 | tail -30

**Key questions:**
- Any 429 (rate limit) responses from external APIs in the last 24h?
- Any 500/502 errors in serverless functions?
- Any build or typecheck regressions?
- Any error patterns that suggest an API key has expired or been revoked?

Output a structured anomaly report:
  Vercel function logs: [CLEAN | N errors — describe]
  Rate limit events: [NONE | describe which API and frequency]
  TypeScript: [CLEAN | N errors]
  Tests: [PASS | N failures]

Flag anything that indicates a production incident, API policy violation risk, or performance regression.
Do not fix anything. Research only.
```

---

## Step 3 — Wait for all five scouts to complete

Collect their full output. Do not synthesise until all five have finished.

---

## Step 4 — Synthesise PLAN_OF_DAY.md

Read the five scout outputs in full. Then think carefully before writing.

**Before picking tasks, apply these filters:**

1. **Legal/policy items first.** The NYC DOT data-sharing agreement and API responsible-use rules are non-negotiable. Any violation or risk surfaces to task #1.
2. **Phase 2 gate items second.** Items that gate Phase 2 progress get next priority.
3. **Is the effort realistic for one day?** S-effort (≤1 day) items only unless a larger item is on a critical path.
4. **Is this busywork?** A cleanup or refactor with no gate impact scores last. If the top "tasks" are busywork, say so explicitly and do not pad the list.
5. **Platform constraints first over features.** If any free-tier limit is approaching, that surfaces immediately.
6. **Security > features.** CRITICAL TODO items and high-severity Dependabot alerts outrank feature work.

Write `PLAN_OF_DAY.md` with this structure:

```markdown
# Plan of Day — {TODAY}

## Standup Snapshot

| Area            | Status   | Notes |
| --------------- | -------- | ----- |
| ROADMAP drift   | 🟢/🟡/🔴 | ...   |
| Platform health | 🟢/🟡/🔴 | ...   |
| Docs drift      | 🟢/🟡/🔴 | ...   |
| TODO/FIXME debt | 🟢/🟡/🔴 | ...   |
| Vercel health   | 🟢/🟡/🔴 | ...   |

Full scout reports are in the terminal output above.

---

## Top 3 Tasks

### 1. {Task title}

**Rationale:** One paragraph. Why this, why today. What unblocks if done.  
**Sketch:** Concrete implementation steps (file paths, function names where known).  
**Estimate:** S (≤1 day) / M (2–5 days) — if M, break it further.  
**Risk:** What could go wrong. What to test first.  
**Overnight-eligible:** YES / NO — reason.

### 2. {Task title}

...same structure...

### 3. {Task title}

...same structure...

---

## Deferred / Busywork

Things that surfaced but do not deserve today's focus:

- {item} — {one-line reason it's low priority right now}

---

## Platform Alerts

{Any free-tier thresholds approaching, API rate limit incidents, legal/policy items — empty if clean}

---

## Phase 2 Gate Status

Phase 2 (Civic Layers) is blocked by:

- {item 1}
- {item 2}
```

**Overnight-eligible criteria:** A task is eligible if it is:

- Well-defined enough to run autonomously without interactive decisions
- Safe to run without human supervision (no external API writes, no policy-sensitive changes)
- Likely to produce a clean PR for review

If any task is overnight-eligible, append after its section:

> **Staging for /overnight:** This task meets the criteria. Run `/overnight "{task title}"` to queue it — or type `no` to skip.

---

## Step 5 — Write and print

1. Write the file to `PLAN_OF_DAY.md` in the project root (overwrite if it exists).
2. Print the full contents to the terminal.
3. If any task is overnight-eligible, print a prompt asking for approval before queuing.

---

## Notes

- If scouts cannot access an external system, note "check manually" — do not skip the report entry or pretend it's clean.
- The command takes ~2–3 minutes. Run it once at the start of your session, not repeatedly.
- `PLAN_OF_DAY.md` is a scratch file. It is gitignored; do not commit it.
- If today's findings are genuinely clear (no Phase 2 blockers, no platform alerts, no drift), say so directly. A short standup is a good standup.
