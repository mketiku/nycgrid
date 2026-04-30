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

| Component             | Path                                                    | What was added                                                                                                                                   |
| --------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| CameraPanel (mobile)  | `src/features/map/CameraPanel.tsx` — `MobileCardNormal` | Focus moves to the close button when the card mounts/changes camera                                                                              |
| CameraPanel (desktop) | `src/features/map/CameraPanel.tsx` — `PanelNormal`      | Already had Escape-to-close, focus-to-first-element on open, and Tab focus trap — no change needed                                               |
| ComplaintModal        | `src/features/chicken-wings/ComplaintModal.tsx`         | Focus trap (Tab cycles within modal), Escape-to-close, initial focus on first focusable element                                                  |
| PhotoboothPreflight   | `src/features/photobooth/PhotoboothPreflight.tsx`       | Checkbox is a real `<input type="checkbox">` (visually hidden via `sr-only`); button disabled until agreed; full keyboard flow confirmed by test |

### Map markers

Camera markers in `MapView` are rendered as MapLibre GL WebGL layers (not DOM elements), so `tabIndex`/`role`/`aria-label` cannot be applied to individual markers. The camera browser panel (`CameraBrowsePanel`) already provides a full keyboard-accessible list of all cameras with `aria-pressed` state and focus-visible outlines.

## Stretch goals

- **ARIA live regions for map updates** — announce "Showing N cameras in Brooklyn" when the borough filter changes, so screen reader users know the map content has changed.
- **Screen reader testing on iOS VoiceOver and Android TalkBack** — automated tests cover DOM semantics but not actual AT behaviour.
- **Skip-to-content link** — a visually hidden "Skip to main content" link at the top of the page would let keyboard users bypass the AppNav on every route.
- **Keyboard activation of map clusters** — MapLibre's WebGL canvas is not keyboard-reachable; a future enhancement could maintain a parallel DOM layer or use a custom accessibility tree overlay so cluster circles respond to Enter/Space.
- **Focus restoration on panel close** — when `CameraPanel` closes, focus should return to the map control that opened it (the camera list item). Currently focus is left wherever it was.
