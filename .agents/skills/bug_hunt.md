# Skill: Bug Hunt

Use this skill to investigate and fix a bug systematically. Always find the root cause.

## The Rule

**Never fix before you understand.** If the proposed cause doesn't fully explain all symptoms, keep investigating.

## Step 1: Gather Symptoms

Before touching any code:

- What exactly is failing? (error, blank screen, wrong data)
- When did it start? (recent deploy, data change)
- Is it reproducible locally?
- Check Vercel Runtime Logs and Observability dashboard first.

## Step 2: Investigate Common Axes

| Axis                  | What to look for                                |
| --------------------- | ----------------------------------------------- |
| **Network**           | HTTP status, response body, CORS                |
| **NYC DOT API**       | Rate limits, offline cameras, stale JPEG cache  |
| **Code path**         | Null checks, async/await gaps, wrong import     |
| **Config**            | Env vars missing or wrong                       |
| **Canvas/Photobooth** | Safari html2canvas quirks, CORS on camera image |

## Step 3: Validate Root Cause

Before writing a fix, confirm the diagnosis explains **all** symptoms.

## Step 4: Write a Failing Regression Test

```bash
bunx vitest run --project unit src/lib/myModule.test.ts
bunx vitest run --project component src/features/my/Component.test.tsx
```

The test must **fail** for the right reason.

## Step 5: Fix

Fix at the source. Do not add defensive code to mask a bug.

## Step 6: Verify

```bash
bunx vitest run
bun run build
```

> A bug is not fixed until a regression test exists and the full suite passes.
