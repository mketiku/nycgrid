# ADR 0001: CI-Owned Deployments and Rollback Procedure

## Status

Accepted (2026-04-30).

## Context

Prior to this ADR, Vercel deployed automatically on every `git push` to `main` — independently of GitHub Actions CI. This meant:

- A broken build could reach production before CI finished running.
- There was no smoke test gate between deploy and production traffic.
- Rollback required manual CLI or dashboard intervention with no documented procedure.

## Decision

**CI owns all production deployments. Vercel's automatic Git deploy is disabled.**

### Deploy model

`Ignored Build Step` in the Vercel dashboard is set to `exit 1`. All deployments are triggered exclusively by `.github/workflows/ci.yml`.

The pipeline on `push` to `main`:

1. **Preflight** — validates Vercel secrets are present; skipped for Dependabot
2. **Lint + TypeScript + Unit tests** — in parallel
3. **Deploy** — `vercel deploy --prod` runs only if lint, typecheck, and unit tests passed
4. **Smoke tests** — hits `/` and `/explore` against the deployment URL
5. **Auto-rollback** — if smoke tests fail, runs `vercel rollback --yes` immediately

On `pull_request`, a `deploy-preview` job runs after all quality checks pass and posts the Vercel preview URL as a PR comment (updated on each push, not duplicated).

### Rollback procedure

**Automatic:** The deploy job rolls back automatically if smoke tests fail.

**Manual — one-click:** GitHub Actions → Workflows → "Rollback Production" → Run workflow. A `reason` field is required for audit trail.

**Manual — CLI:**

```bash
vercel rollback --token=$VERCEL_TOKEN
```

To roll back to a specific prior deployment:

```bash
vercel ls                          # find the deployment URL
vercel promote <deployment-url>    # instant, no rebuild
```

### Required GitHub secrets

| Secret              | Purpose                                 | Where to obtain                         |
| ------------------- | --------------------------------------- | --------------------------------------- |
| `VERCEL_TOKEN`      | Authenticates the Vercel CLI in CI      | vercel.com → Account Settings → Tokens  |
| `VERCEL_ORG_ID`     | Scopes CLI commands to the correct team | `.vercel/project.json` in the repo root |
| `VERCEL_PROJECT_ID` | Scopes CLI commands to this project     | `.vercel/project.json` in the repo root |

## Alternatives rejected

### Vercel "Deployment Protection" (Require CI to pass)

Vercel Pro offers a setting that blocks deploys until GitHub checks pass. Rejected because Vercel still runs its own independent build — CI does not own the deploy trigger and cannot gate on it reliably.

### Keep Vercel auto-deploy, add post-deploy smoke test

Rejected because Vercel deploys concurrently with CI, so CI cannot reliably observe the new deployment URL for smoke testing.

## Consequences

- Broken builds cannot reach production — deploy only runs after quality checks pass.
- Smoke tests catch runtime failures before production traffic hits the new deploy.
- Auto-rollback keeps degraded deployments short-lived.
- Deploy latency increases by the full CI duration (~3–5 minutes) vs Vercel's ~1–2 minute auto-deploy.