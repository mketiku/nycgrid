# Contributing to NycGrid

Thanks for your interest in contributing. This is a side project built for fun — contributions that improve the core experience are welcome.

## Before you start

- **Open an issue first** for anything beyond a small bug fix. This avoids duplicate work and lets us align on direction before you write code.
- Check existing issues and PRs to see if someone is already working on it.

## Setup

```bash
# 1. Fork and clone the repo
git clone https://github.com/your-username/nycgrid.git
cd nycgrid

# 2. Install dependencies (Bun required)
bun install

# 3. Copy env template and fill in any keys for the features you need
cp .env.example .env.local

# 4. Start the dev server
bun dev
```

See `docs/setup/` for setup guides for each optional service (transit alerts, events, etc.).

## Development workflow

This project uses a red-green-refactor TDD cycle. For any bug fix or new feature:

1. Write a failing test that describes the expected behavior
2. Confirm it fails
3. Implement until it passes
4. Refactor if needed

```bash
bun run test:unit        # pure logic
bun run test:component   # DOM rendering
bun run test:integration # HTTP-level (MSW)
bunx vitest run          # full suite

bun run typecheck        # TypeScript check
bun run lint             # ESLint + Prettier
```

All of these must pass before opening a PR.

## Code standards

- **Package manager**: Bun only — never `npm` or `pnpm`
- **Typing**: `any` is a lint error. Fix it.
- **No console.log**: Remove before committing. `warn` and `error` are fine.
- **Feature-first structure**: New features go in `src/features/<name>/`. Expose a clean interface via `index.ts`.
- **Server Components first**: Don't add `'use client'` without considering if the component can stay on the server.
- **Privacy**: This project uses public infrastructure data. Do not build features that could identify or track individuals.

## Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(map): add camera type filter to sidebar
fix(photobooth): fix canvas capture on Safari
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Pull requests

- Keep PRs focused — one feature or fix per PR
- Include a test that fails before and passes after (for bug fixes)
- Update relevant docs if behavior changes
- The PR template has a checklist — fill it in

## Adding ambient music tracks

Ambient music lives in the separate [`mketiku/nycgrid-assets`](https://github.com/mketiku/nycgrid-assets) repo and is served via jsDelivr CDN. To add a track:

**1. Add the file to `nycgrid-assets`**

Drop your `.mp3` into `audio/ambient/` and push to `main`. File names should be lowercase with underscores (`lofi_mytrack.mp3`).

**2. Cut a new semver tag**

```bash
git tag v1.x.0
git push origin v1.x.0
```

jsDelivr serves tagged releases. Never reference `@main` — it isn't cached and may be rate-limited.

**3. Update the CDN constant in this repo**

In `src/features/ambient/AmbientPlayer.tsx`, bump the `CDN` constant:

```ts
const CDN = "https://cdn.jsdelivr.net/gh/mketiku/nycgrid-assets@v1.x.0";
```

**4. Add the track to `LOFI_TRACKS`**

In the same file, add an entry to the `LOFI_TRACKS` array:

```ts
{ url: `${CDN}/audio/ambient/lofi_mytrack.mp3`, minPlays: 2, maxPlays: 4 },
```

`minPlays`/`maxPlays` controls how many times the track loops before the player crossfades to the next one. Longer or more atmospheric tracks suit higher values (3–6); shorter or punchier tracks suit lower ones (1–3).

**5. Open a PR**

Commit the CDN bump and `LOFI_TRACKS` entry together. The PR description should name the track and note the source/license.

---

## What we're not looking for

- Changing the tech stack
- Features that aggregate, store, or replay individual camera footage
- Large refactors without prior discussion

## Questions

Open a GitHub issue with the `question` label.
