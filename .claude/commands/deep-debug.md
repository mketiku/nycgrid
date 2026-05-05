# /deep-debug

Invoke this command when diagnosing any bug. It enforces a five-gate protocol that must be completed in order — no gate may be skipped, and no code may be edited until Gate 4 is cleared.

---

## Gate 1 — Reproduce the Bug

Produce a concrete, runnable reproduction before forming any hypothesis.

**Accepted reproductions (pick the lightest that works):**

```bash
# Unit or component regression test (preferred)
bunx vitest run --project unit src/path/to/module.test.ts
bunx vitest run --project component src/features/foo/Foo.test.tsx

# Integration: HTTP-level via MSW
bunx vitest run --project integration src/lib/api/foo.test.ts

# Network probe
curl -si http://localhost:3000/api/your-route | head -20

# E2E (only when lower tiers can't express the behavior)
bun run test:e2e -- --grep "your scenario"
```

**Gate 1 is cleared when:** a command or test output that exists _right now_ demonstrates the failure. Screenshots, user descriptions, and log excerpts do not count as reproductions — they are symptoms.

---

## Gate 2 — Hypothesis Table

Before touching any code, list **at least three** plausible root-cause hypotheses. For each:

| #   | Hypothesis | Evidence FOR | Evidence AGAINST | Likelihood   |
| --- | ---------- | ------------ | ---------------- | ------------ |
| 1   | …          | …            | …                | High/Med/Low |
| 2   | …          | …            | …                | High/Med/Low |
| 3   | …          | …            | …                | High/Med/Low |

Rules:

- Hypotheses must be **mechanistic** ("the DOT API response is cached at the edge and stale frames are served") not symptomatic ("the camera feed is frozen").
- One hypothesis MUST challenge the most obvious explanation. The obvious explanation is wrong more often than it appears.
- If multiple hypotheses survive Gate 2, investigate the easiest-to-disprove ones first and update the table before proceeding.

**Gate 2 is cleared when:** the table is complete, at least one hypothesis is marked as the working theory with surviving evidence, and all obvious alternatives have been weighed.

---

## Gate 3 — Failing Regression Test

Write a test that:

1. **Fails right now** for the reason described by the working hypothesis (not an unrelated error).
2. **Would pass only if the true root cause is fixed** — not if a symptom is suppressed.
3. Includes a comment block at the top:
   ```ts
   // Regression: <one-line symptom description>
   // Root cause: <the mechanistic explanation from Gate 2>
   // Reproduction: <exact command that first demonstrated the bug>
   ```

Place the test in the lightest tier that can express the causality:

| Root cause lives in…                          | Tier          |
| --------------------------------------------- | ------------- |
| Pure logic / utility                          | `unit`        |
| Component render / hook / router interaction  | `component`   |
| HTTP request/response headers, redirects, MSW | `integration` |
| Full browser navigation, session persistence  | `e2e`         |

Run it and confirm it **fails for the right reason**:

```bash
bunx vitest run --project <tier> path/to/regression.test.ts
```

**Gate 3 is cleared when:** the test output shows a failure that directly implicates the working hypothesis.

---

## Gate 4 — Skeptic Review

Before writing any production code, invoke the skeptic skill:

```
Use the .claude/skills/skeptic.md skill. Pass it:
  1. The working hypothesis from Gate 2
  2. The proposed fix (describe it in code or prose — do not implement it yet)
  3. The regression test from Gate 3
  4. Any evidence gathered so far (logs, curl output, test output)

The skeptic must explicitly answer:
  (a) Is this a bandage or a root-cause fix?
  (b) What symptom-level evidence supports this fix?
  (c) What cause-level evidence supports this fix?
  (d) Is there a deeper layer that this fix leaves unaddressed?
  (e) VERDICT: APPROVED / REJECTED / CONDITIONAL (with conditions)
```

**Gate 4 is cleared when:** the skeptic returns APPROVED or CONDITIONAL with all conditions documented.

If the skeptic returns REJECTED, return to Gate 2 and revise the hypothesis table.

---

## Gate 5 — Implement the Fix

Only after Gates 1–4 are all cleared:

1. Write the minimal fix that addresses the root cause identified in Gate 2 and approved in Gate 4.
2. Fix at the source — not at the symptom surface.
3. Run the regression test from Gate 3 and confirm it now **passes**.
4. Run the full suite: `bunx vitest run`
5. For bugs with a network/routing surface: rebuild and re-probe: `bun run build && curl -si …`

**Gate 5 is cleared when:** the regression test passes, the full suite is green, and the exact failing scenario from Gate 1 no longer reproduces.

---

> [!IMPORTANT]
> No code edit may happen before Gate 4 is cleared. If you find yourself writing a fix before the skeptic has reviewed it, stop and complete the protocol.
