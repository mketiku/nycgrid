# Camera refresh bot (GitHub App)

The weekly `Refresh camera list` workflow (`.github/workflows/refresh-cameras.yml`)
pushes the updated camera list, opens a PR, and turns on auto-merge. It does all
three with a GitHub App installation token instead of `GITHUB_TOKEN`.

## Why not `GITHUB_TOKEN`

Workflow runs on a PR pushed with `GITHUB_TOKEN` are started by
`github-actions[bot]`, and GitHub holds them as `action_required` until a
maintainer clicks **Approve and run**. Required checks never report, so the PR
stays blocked. A merge done with `GITHUB_TOKEN` also would not trigger the
`push` to `main` that runs the production deploy. App-token pushes trigger
workflows normally.

## One-time setup

1. Create the App at <https://github.com/settings/apps/new>:
   - **Name**: anything unique, e.g. `nycgrid-camera-bot`.
   - **Homepage URL**: the repository URL.
   - **Webhook**: untick **Active**.
   - **Repository permissions**: Contents → Read and write, Pull requests → Read and write.
     Leave everything else at No access.
   - **Where can this GitHub App be installed?**: Only on this account.
2. On the App's page, copy the **App ID**, then under **Private keys** click
   **Generate a private key** (downloads a `.pem` file).
3. **Install App** → your account → **Only select repositories** → `nycgrid`.
4. In `nycgrid` → Settings → Secrets and variables → Actions:
   - **Variables** tab: `CAMERA_BOT_APP_ID` = the App ID.
   - **Secrets** tab: `CAMERA_BOT_PRIVATE_KEY` = the full contents of the `.pem` file.
5. Delete the local `.pem` file, then run the workflow once from the Actions tab
   (**Run workflow**) to confirm it opens or updates the PR with auto-merge on.

## Merge behaviour

`gh pr merge --auto --squash` merges the PR once the `main` ruleset's required
status checks pass; the ruleset requires zero approving reviews. The repository
must keep **Allow auto-merge** enabled (Settings → General).

## Failure modes

- Missing variable or secret: the **Mint GitHub App token** step fails and no
  PR is opened. The camera data is unchanged.
- Expired or revoked key: same as above. Generate a new key and replace the secret.
- CI fails on the refresh PR: auto-merge waits; the PR stays open for review.
