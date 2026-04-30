# Accessibility Status

## Fixed

### Skeleton loaders

| Component           | Path                                               | What was added                                                                                                   |
| ------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| GalleryClient       | `src/features/gallery/GalleryClient.tsx`           | Loading skeleton (4 placeholder cards, `animate-pulse`) shown while `useMyShots` initialises from `localStorage` |
| LiveConditions      | `src/features/context/LiveConditions.tsx`          | Already had `LiveConditionsSkeleton` — no change needed                                                          |
| CameraSpotlight     | `src/features/spotlight/CameraSpotlight.tsx`       | Already had `CameraSpotlightSkeleton` — no change needed                                                         |
| RecommendationsCard | `src/features/camera-feed/RecommendationsCard.tsx` | Data-driven by props (no async loading) — no skeleton needed                                                     |

`useMyShots` (`src/hooks/useMyShots.ts`) now exposes `isLoading: boolean` so consumers can distinguish "not yet loaded" from "loaded and empty".

### Keyboard / focus management

| Component                       | Path                                                    | What was added                                                                                                                                           |
| ------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CameraPanel (mobile)            | `src/features/map/CameraPanel.tsx` — `MobileCardNormal` | Focus moves to the close button when the card mounts/changes camera                                                                                      |
| CameraPanel (desktop)           | `src/features/map/CameraPanel.tsx` — `PanelNormal`      | Already had Escape-to-close, focus-to-first-element on open, and Tab focus trap — no change needed                                                       |
| CameraPanel (focus restoration) | `src/features/map/MapView.tsx` + `CameraPanel.tsx`      | When the panel closes via Escape or the close button, focus returns to the camera list item that opened it. Click-elsewhere closes do not restore focus. |
| CameraPanel (modal semantics)   | `src/features/map/CameraPanel.tsx`                      | Both mobile and desktop dialogs expose `aria-modal="true"` so assistive tech treats the panel as a modal context.                                        |
| ComplaintModal                  | `src/features/chicken-wings/ComplaintModal.tsx`         | Focus trap (Tab cycles within modal), Escape-to-close, initial focus on first focusable element                                                          |
| PhotoboothPreflight             | `src/features/photobooth/PhotoboothPreflight.tsx`       | Checkbox is a real `<input type="checkbox">` (visually hidden via `sr-only`); button disabled until agreed; full keyboard flow confirmed by test         |

### Map markers

Camera markers in `MapView` are rendered as MapLibre GL WebGL layers (not DOM elements), so `tabIndex`/`role`/`aria-label` cannot be applied to individual markers. The camera browser panel (`CameraBrowsePanel`) already provides a full keyboard-accessible list of all cameras with `aria-pressed` state and focus-visible outlines.

**Cluster activation by keyboard** is not implemented and is out of scope for the current accessibility pass. MapLibre clusters are rendered into a single `<canvas>` element; making each cluster individually focusable would require maintaining a parallel hidden DOM tree of cluster positions and synchronising it with every map move, zoom, and re-cluster. The browser panel keyboard list already gives keyboard users every camera the clusters represent.

### Live regions

| Component              | Path                                                         | What was added                                                                                                                                                              |
| ---------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MapView borough filter | `src/features/map/MapView.tsx` + `useBoroughAnnouncement.ts` | An `sr-only` live region (`role="status"`, `aria-live="polite"`) announces "Showing N cameras in {borough}" or "Showing all N cameras" whenever the borough filter changes. |

### Automated ARIA verification

`src/features/map/__tests__/aria-attributes.test.tsx` asserts the canonical ARIA contract for `CameraPanel` (role, label, modal), `GalleryClient` skeleton (status, label), `ComplaintModal` (role, modal, label), `PhotoboothPreflight` (real `input[type=checkbox]`), and the borough filter buttons (`aria-pressed`). It is the regression net for screen-reader semantics in lieu of manual VoiceOver/TalkBack runs.

## Stretch goals

- **Screen reader testing on iOS VoiceOver and Android TalkBack** — automated tests cover DOM semantics but not actual AT behaviour.
- **Skip-to-content link** — a visually hidden "Skip to main content" link at the top of the page would let keyboard users bypass the AppNav on every route.
