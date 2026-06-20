# NycGrid — Engineering Standards

Standards for the **nycgrid** repository (Next.js 16, React 19, TypeScript).

## Working With Developers

- **Stay in scope**: Do not implement changes beyond what was explicitly requested. Always surface limitations, trade-offs, and improvement opportunities — but as commentary, not unilateral code changes. Wait for approval before acting on them.
- **Check before asking**: Before asking the user a clarifying question, search the codebase for existing patterns, configs, and conventions. The answer is usually already there.
- **Design questions**: Discuss first, don't jump to code.
- **Consultative**: When asked for feedback, respond with discussion ONLY until explicitly asked to implement.
- **Bug fixes**: Follow the Debugging Approach in §2. Never weaken tests to pass. Never remove functionality to avoid errors.
- **TDD gate**: Before writing any implementation code, write and run failing tests first. A detailed spec is not an excuse to skip red — it's a blueprint for the tests. Never touch production code until at least one test is red. Run the failing tests and show the red output as a checkpoint before proceeding.

## Investigation Style

- **Root cause first**: Find the ROOT CAUSE before applying bandage fixes.
- **Reconsider on pushback**: When the user pushes back on an approach, stop and reconsider rather than defending the initial choice.
- **Audit the broader surface**: When fixing one instance of an issue, audit the whole system for related cases instead of patching only the reported instance.

## Decision Drivers

- Quality is non-negotiable — better small & excellent than large & mediocre
- Prefer designs that preserve vendor portability. Isolate external-service-specific code behind clear local interfaces.
- Tech stack choices are the Developer's call

## 1. Architecture (Feature-First)

- **Feature Isolation**: Organize by feature (`src/features/map`, `src/features/photobooth`, `src/features/camera-feed`). Each feature encapsulates its own logic, components, and hooks. Expose a clean interface via `index.ts`.
- **Dependency Flow**: `src/components/ui` → `src/hooks` → `src/lib` → `src/features`
- **Strict Typing**: `any` is a lint error. Always run `bun run typecheck` after edits before any git operation. Fix all TypeScript errors before proceeding.
- **Clean Code**: Prefer small focused functions, explicit intent, straightforward control flow. Eliminate real duplication but avoid premature abstractions.
- **Persistent map**: `MapView` is mounted once inside `PersistentMap` (`src/features/map/PersistentMap.tsx`), which lives in the root layout. The `/explore` page renders only legal attribution links — do not add `MapView` to the explore page or mount it anywhere else. Duplicating it will create two WebGL contexts and two sets of camera markers.

## 2. Debugging Approach

- **Root cause first**: When a bug is reported, identify the root cause before applying fixes.
- **Step back after one failed fix**: If a first fix doesn't work, reconsider the architecture rather than iterating on shallow changes to the same surface.
- **Audit system-wide**: When fixing one instance of an issue, audit the whole system for related cases before declaring the fix done.

## 3. React & Next.js (v19 / v16)

**`next.config.ts` import constraint**: Any file imported (directly or transitively) by `next.config.ts` must use **relative imports only** — no `@/` path aliases. Next.js evaluates the config before alias resolution is available, so `@/` imports silently resolve locally (Vitest handles them) but fail at Vercel build time. Currently affected: `src/lib/security/headers.ts`, `src/lib/assets/cdn.ts`.

- **Server Components First**: Never add `'use client'` without considering if the component can remain a Server Component. MapLibre GL and camera feed components WILL need `'use client'` — that's expected and fine.
- **Async Request APIs (Breaking)**: `params`, `searchParams`, `cookies()`, `headers()` are **Promises** — you MUST await them.
- **State Management**: TanStack Query for server state, Zustand for lightweight client state (selected camera, photobooth mode), `useState`/`useReducer` for local state.
- **Forms**: Use `useActionState` and Server Actions for form logic where possible.
- **Query Safety**: All `queryFn` must provide a non-undefined fallback (e.g., `?? null`, `?? []`).
- **Performance**: Avoid manual `useMemo`/`useCallback` unless fixing a proven re-render loop.
- **Streaming**: Data-heavy routes SHOULD have `loading.tsx` and `<Suspense>` with high-fidelity skeletons.
- **Metadata**: Use `generateMetadata` for dynamic routes. Any `generateMetadata` that makes an async call MUST wrap its body in `try/catch` returning `{}` or `{ title: "NycGrid" }` on failure.
- **Animations**: Import from `motion/react` (v12+ standard, React 19 compatible).
- **Maps**: MapLibre GL requires `'use client'`. Always initialize the map in a `useEffect` and clean up with `map.remove()` on unmount.
- **`MapView.pushParams` uses `window.history.replaceState` — do not change this to `router.replace`.** The URL update is a permalink side-effect only; all state is local. `router.replace` triggers a full App Router navigation cycle (~600ms); `replaceState` is instant. This is intentional.

### Isolating side-effects in route handlers

Wrap each side-effect in its own `try/catch` — or use `void fn().catch(() => ...)` for fire-and-forget. A single `await` that throws inside a shared handler-level `try` will short-circuit every side-effect that follows.

### Error monitoring

- **Default to Vercel-native observability.** Prefer Vercel Web Analytics, Runtime Logs, and Observability over third-party client monitoring unless explicitly approved.
- **Privacy first**: Do not add third-party analytics or error-monitoring scripts without a clear product need, a documented privacy impact, and an update to `docs/`.

## 4. NYC DOT Camera API

- **Endpoint**: `https://webcams.nyctmc.org/api/cameras/{id}/image` — returns a JPEG snapshot.
- **No auth required**: Public API. Do not add auth headers.
- **Cache-busting on live view**: Append `?t=${Date.now()}` to force fresh frames. Use `setInterval` with a minimum refresh rate of 15s (DOT integration guide requirement) — do not hammer the DOT API.
- **Camera data**: Lives in `src/lib/cameras/data.ts` as a typed static array. Source: NYC DOT open data. Do not fetch the camera list dynamically — it's stable and large; a static file is faster and cheaper.
- **Respect the source**: These are public traffic cameras. The photobooth feature is a creative use of public data. Do not build features that aggregate or surveil individuals.

### Camera image URL strategy

Two URL strategies exist — pick the right one or the canvas will be tainted:

| Use case                                              | URL to use                                   | Why                                                                                              |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Live view only (explore, preflight)                   | `cameraImageUrl(id)` — direct DOT URL        | No canvas involved; direct is faster                                                             |
| Any canvas operation (GIF export, photobooth capture) | `/api/camera-image/[id]` — same-origin proxy | DOT is cross-origin with no CORS headers; direct URL taints the canvas and breaks `getImageData` |

**Rule**: if an `<img>` will ever be passed to `ctx.drawImage()` or `canvas.toDataURL()`, it MUST be loaded through the proxy route. Use `proxiedImageUrl(id)` (with `?t=`) for refreshes, and `/api/camera-image/[id]` (no timestamp) for initial `useState` to avoid hydration mismatches.

## 5. UI/UX (Urban Aesthetic)

> **Always read `docs/context/style-guide.md` before writing any UI code.** It is the canonical visual contract.

- **Design**: "Terminal Urban" — dark backgrounds, monospace accents, high-contrast data-forward UI. Inspired by damnlines.com but distinct.
- **Color tokens**: Use semantic tokens defined in `tailwind.config.ts`. Never use raw Tailwind palette colors (`gray-500`, `blue-200`, etc.) in components.
- **Typography**: Monospace for camera names/data, sans-serif for body. Both loaded via `next/font`.
- **Accessibility**: Semantic HTML, ARIA attributes, keyboard navigation.
- **Navigation**: Use `Link` for page navigation. Use `button` for in-place actions.
- **Dark Mode**: Default dark. Light mode is a stretch goal, not a requirement.
- **Skeletons**: Every dynamic feature MUST implement a skeleton loader. Never leave a screen blank during fetching.
- **Map**: Always include a fallback list view for accessibility (not everyone can use an interactive map).
- **Photobooth**: Canvas-based. Always test capture on Safari — `html2canvas` has known Safari quirks.

## 6. Testing & Quality

- **TDD By Default**: Red-Green-Refactor for every implementation and bug fix. Write a failing test first, run it, and show the red output before writing any implementation. See `.claude/skills/tdd-workflow.md` for the full workflow.
- **Tiered Test Projects** (`vitest.config.ts`):
  - `bun run test:unit` — pure logic, no DOM, no MSW
  - `bun run test:component` — DOM rendering (happy-dom)
  - `bun run test:integration` — MSW HTTP-level tests
  - `bunx vitest run` — full suite. Run before marking any task complete.
- **Regression Tests**: Every bug fix MUST include a test that fails before and passes after.
- **No Real Network Calls**: Mock all outbound HTTP — NYC DOT API, transit/weather providers, and any future third-party service — at the test harness boundary.
- **E2E (Playwright)**: For critical user flows (find camera → view feed → take photo → download). Run with `bun run test:e2e`.

## 7. Workflow & Commits

- **Package manager is Bun**: Use `bun install`, `bun run`, `bunx`. Never `npm` or `pnpm` — they drift the lockfile and break CI.
- **Formatting**: ESLint with integrated Prettier. Run `bun run lint` before any push.
- **No Console Logs**: Remove all `console.log` before committing. `console.warn` and `console.error` are allowed.
- **No Absolute Paths**: Use relative paths. Never reference `/Users/...`.
- **Pre-commit validation**: `node scripts/run-hook-checks.mjs pre-commit` (lint + unit tests).
- **Pre-push validation**: `node scripts/run-hook-checks.mjs pre-push` (lint + typecheck + coverage).
- **Never push to main without approval**.
- **Conventional Commits**: `type(scope): concise summary` (7–14 words).
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
  - Examples: `feat(map): add camera markers with live status indicators`, `fix(photobooth): fix canvas capture on Safari`
- **Skip builds for non-code changes**: Use two distinct skip mechanisms — they are independent.
  - `[skip ci]` in the commit message skips **GitHub Actions** (CI pipeline). Vercel also honours this tag and skips its own build. Use it for docs, ADRs, and any change that does not affect the running app. Examples: `docs: update notes [skip ci]`, `chore: update AGENTS.md [skip ci]`.
  - **Vercel Ignored Build Step** (dashboard → Project Settings → Git) runs `bash scripts/vercel-build-skip.sh` before every build. The script auto-skips when only non-app files changed and supports a `[skip vercel]` manual tag to skip Vercel without skipping GitHub CI. See `.claude/skills/ci-skip.md` for the decision table and script details.
- **Plan Before Implementation**: When asked to create a plan, produce it first and wait for approval before code changes.

## 8. Documentation Standards

All documentation lives in `docs/`. Never create ad-hoc docs in the root.

- `docs/context/` — project state: `architecture.md`, `style-guide.md`, `testing.md`, `platform-constraints.md`
- `docs/adr/` — Architectural Decision Records
- `docs/spec/` — feature specifications
- **New public resources require documentation**: Whenever adding a new public API, dataset, feed, or other external public resource, add a guide in `docs/` that documents the source, allowed usage, Terms of Service / usage-policy review, authentication expectations, rate-limit impact, caching strategy, failure modes, and any operational cost or platform constraints before merging.

## 9. Skills & Deep Context

Agents should use `.claude/skills/` for workflow guidance and `.claude/commands/` for slash commands.

### Skills (`.claude/skills/`)

| Skill                     | When to use                                                   |
| ------------------------- | ------------------------------------------------------------- |
| `commit`                  | Before every `git commit` or `git push`                       |
| `tdd-workflow`            | Every implementation, feature, or bug fix                     |
| `nextjs-feature-workflow` | Pages, layouts, server actions, component work                |
| `validation`              | Pre-commit/pre-push checks, hook failures                     |
| `cv-pipeline`             | Adding/upgrading the computer vision pipeline                 |
| `ci-skip`                 | Deciding when/how to skip CI or Vercel builds                 |
| `skeptic`                 | Gate 4 of `/deep-debug` — challenge fixes before writing code |

### Commands (`.claude/commands/`)

| Command      | When to use                             |
| ------------ | --------------------------------------- |
| `deep-debug` | Diagnosing any bug — five-gate protocol |

### Review Agents (`.claude/agents/`)

| Agent           | When to use                                          |
| --------------- | ---------------------------------------------------- |
| `a11y-reviewer` | PR review — WCAG 2.1 AA accessibility findings       |
| `perf-reviewer` | PR review — bundle size, rendering, Next.js patterns |

## 10. Domain Knowledge

- **Project**: NycGrid — explore NYC through its public traffic camera network. Photobooth, live feeds, ambient mode.
- **Backend**: Current app features are public-read and API-light; future write paths should remain vendor-portable.
- **Data Source**: NYC Department of Transportation open traffic camera API.
- **Privacy**: This project uses 100% public data. Cameras are public infrastructure. Never build features that could be used to track specific individuals.
- **Free Tier First**: Design for low-cost operation on Vercel Hobby and public/free-tier data providers until the project proves traction.
- **Responsible API Client**: NycGrid must never cause undue load on any external service. Cache aggressively, use the most conservative refresh rate that meets the UX goal, and cost out any new periodic call against monthly limits before merging. Full rules in `docs/context/platform-constraints.md`.
- **Platform**: Vercel Hobby + public APIs. See `docs/context/platform-constraints.md` for limits and rules.
- **Static assets (audio)**: Hosted in the `mketiku/nycgrid-assets` GitHub repo and served via jsDelivr CDN (`https://cdn.jsdelivr.net/gh/mketiku/nycgrid-assets@<tag>/...`). When adding new files: (1) push to `nycgrid-assets`, (2) cut a new semver tag (`v1.1.0`, `v1.2.0`, etc.), (3) update the `CDN` constant in `src/features/ambient/AmbientPlayer.tsx` to match, (4) **update the `media-src` directive in `src/lib/security/headers.ts`** to the new tag — the CSP pins the exact tag and will block playback if it falls behind, and commit all three changes together. Always reference a pinned tag — never `@main`. jsDelivr caches tagged URLs forever; old tagged URLs remain valid after a version bump.
