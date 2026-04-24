"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Share2, Check, Eye, Star } from "lucide-react";
import type { Camera } from "@/lib/cameras/types";
import { MAX_COLLECTION_SIZE, encodeCameraIds } from "@/lib/collections/data";
import { useFavourites } from "@/hooks/useFavourites";
import { useShareUrl } from "@/hooks/useShareUrl";

interface CollectionBuilderProps {
  cameras: Camera[];
  initialIds?: string[];
}

export function CollectionBuilder({ cameras, initialIds = [] }: CollectionBuilderProps) {
  const router = useRouter();
  const { favourites } = useFavourites();
  const [selected, setSelected] = useState<Camera[]>(() =>
    initialIds.slice(0, MAX_COLLECTION_SIZE).flatMap((id) => {
      const cam = cameras.find((c) => c.id === id);
      return cam ? [cam] : [];
    })
  );
  const [query, setQuery] = useState("");

  const filteredCameras = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cameras;
    return cameras.filter((c) => `${c.name} ${c.area}`.toLowerCase().includes(q));
  }, [cameras, query]);

  const selectedIds = useMemo(() => new Set(selected.map((c) => c.id)), [selected]);
  const favouriteCameras = useMemo(
    () => filteredCameras.filter((camera) => favourites.has(camera.id)),
    [filteredCameras, favourites]
  );
  const regularCameras = useMemo(
    () => filteredCameras.filter((camera) => !favourites.has(camera.id)),
    [filteredCameras, favourites]
  );

  const toggle = useCallback(
    (camera: Camera) => {
      if (selectedIds.has(camera.id)) {
        setSelected((prev) => prev.filter((c) => c.id !== camera.id));
      } else if (selected.length < MAX_COLLECTION_SIZE) {
        setSelected((prev) => [...prev, camera]);
      }
    },
    [selectedIds, selected.length]
  );

  const collectionUrl = useMemo(() => {
    if (selected.length === 0) return null;
    const encoded = encodeCameraIds(selected.map((c) => c.id));
    return `/collections/custom?c=${encodeURIComponent(encoded)}`;
  }, [selected]);

  const handleView = useCallback(() => {
    if (collectionUrl) router.push(collectionUrl);
  }, [collectionUrl, router]);

  const shareableUrl = collectionUrl ? `${window.location.origin}${collectionUrl}` : undefined;
  const { copied, share: handleShare } = useShareUrl(shareableUrl);

  const renderCameraRow = useCallback(
    (camera: Camera, showFavouriteBadge = false) => {
      const isSelected = selectedIds.has(camera.id);
      const isFull = selected.length >= MAX_COLLECTION_SIZE && !isSelected;

      return (
        <li key={camera.id}>
          <button
            type="button"
            onClick={() => toggle(camera)}
            disabled={isFull}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isSelected ? "var(--color-elevated)" : "transparent",
              border: `1px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
            }}
          >
            <span
              className="inline-flex h-2 w-2 rounded-full shrink-0"
              style={{
                backgroundColor: camera.isOnline ? "var(--color-online)" : "var(--color-offline)",
              }}
            />
            <span className="flex-1 min-w-0">
              <span className="block font-mono text-sm text-[var(--color-text-primary)] truncate">
                {camera.name}
              </span>
              <span className="block font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
                {camera.area}
              </span>
            </span>
            {showFavouriteBadge ? (
              <span
                className="inline-flex items-center gap-1 shrink-0 font-mono text-[10px] uppercase tracking-widest"
                style={{ color: "var(--color-accent)" }}
              >
                <Star className="w-3 h-3" fill="currentColor" />
                Fav
              </span>
            ) : null}
            {isSelected && (
              <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--color-accent)" }} />
            )}
          </button>
        </li>
      );
    },
    [selectedIds, selected.length, toggle]
  );

  return (
    <div className="flex flex-col h-full min-h-0 gap-0 lg:flex-row lg:gap-6">
      {/* Camera picker — fills all available height on mobile */}
      <div className="flex flex-col gap-3 flex-1 min-h-0 lg:max-w-md">
        <div className="flex items-baseline justify-between">
          <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
            Add cameras
          </h2>
          <span className="font-mono text-xs text-[var(--color-text-secondary)]">
            {selected.length} / {MAX_COLLECTION_SIZE}
          </span>
        </div>

        <input
          type="search"
          placeholder="Search by name or borough…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        />

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-3 pr-1">
            {favouriteCameras.length > 0 ? (
              <section className="flex flex-col gap-1.5" aria-label="Favourites section">
                <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
                  Favourites
                </h3>
                <ul className="flex flex-col gap-1">
                  {favouriteCameras.map((camera) => renderCameraRow(camera, true))}
                </ul>
              </section>
            ) : null}

            <section className="flex flex-col gap-1.5" aria-label="All cameras section">
              {favouriteCameras.length > 0 ? (
                <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
                  All cameras
                </h3>
              ) : null}
              <ul className="flex flex-col gap-1">
                {regularCameras.length > 0 ? (
                  regularCameras.map((camera) => renderCameraRow(camera))
                ) : (
                  <li className="px-3 py-4 text-center font-mono text-xs text-[var(--color-text-muted)]">
                    No cameras match your search
                  </li>
                )}
              </ul>
            </section>
          </div>
        </div>
      </div>

      {/* Mobile: compact bottom bar — never lets collection section crowd the picker */}
      <div className="lg:hidden flex flex-col gap-2 border-t border-[var(--color-border)] pt-3 mt-3 shrink-0">
        {selected.length > 0 && (
          <div
            className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1"
            aria-label="Selected cameras"
          >
            {selected.map((camera) => (
              <div
                key={camera.id}
                className="flex items-center gap-1 shrink-0 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1"
              >
                <span className="font-mono text-[10px] text-[var(--color-text-primary)] whitespace-nowrap max-w-[110px] truncate">
                  {camera.name}
                </span>
                <button
                  type="button"
                  onClick={() => toggle(camera)}
                  aria-label={`Remove ${camera.name}`}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-offline)] transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleView}
            disabled={selected.length === 0}
            className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded font-mono text-xs uppercase tracking-widest transition-colors disabled:cursor-not-allowed"
            style={{
              backgroundColor: selected.length > 0 ? "var(--color-accent)" : "transparent",
              border: `1px solid ${selected.length > 0 ? "var(--color-accent)" : "var(--color-border)"}`,
              color: selected.length > 0 ? "var(--color-base)" : "var(--color-text-muted)",
            }}
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={selected.length === 0}
            className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded border font-mono text-xs uppercase tracking-widest transition-colors disabled:cursor-not-allowed"
            style={{
              borderColor: copied ? "var(--color-online)" : "var(--color-border)",
              color: copied
                ? "var(--color-online)"
                : selected.length > 0
                  ? "var(--color-text-secondary)"
                  : "var(--color-text-muted)",
            }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      </div>

      {/* Desktop sidebar: full collection preview */}
      <div className="hidden lg:flex flex-col gap-4 lg:w-72 shrink-0">
        <div className="flex flex-col gap-1">
          <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
            Your collection
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {selected.length === 0
              ? "Select cameras from the list"
              : `${selected.length} camera${selected.length === 1 ? "" : "s"} selected`}
          </p>
        </div>

        {selected.length > 0 ? (
          <ul className="flex flex-col gap-1 max-h-none overflow-y-auto">
            {selected.map((camera, i) => (
              <li
                key={camera.id}
                className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                <span className="font-mono text-[10px] text-[var(--color-text-muted)] w-4 shrink-0 text-right">
                  {i + 1}
                </span>
                <span className="flex-1 min-w-0 font-mono text-xs text-[var(--color-text-primary)] truncate">
                  {camera.name}
                </span>
                <button
                  type="button"
                  onClick={() => toggle(camera)}
                  aria-label={`Remove ${camera.name}`}
                  className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded text-[var(--color-text-muted)] hover:text-[var(--color-offline)] transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-[var(--color-border)] p-6 flex items-center justify-center">
            <p className="font-mono text-xs text-[var(--color-text-muted)] text-center">
              No cameras yet
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-auto">
          <button
            type="button"
            onClick={handleView}
            disabled={selected.length === 0}
            className="inline-flex items-center justify-center gap-2 w-full min-h-[44px] rounded font-mono text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-base)",
            }}
          >
            <Eye className="w-4 h-4" />
            View collection
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={selected.length === 0}
            className="inline-flex items-center justify-center gap-2 w-full min-h-[44px] rounded border font-mono text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              borderColor: copied ? "var(--color-online)" : "var(--color-border)",
              color: copied ? "var(--color-online)" : "var(--color-text-secondary)",
            }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? "Link copied!" : "Copy share link"}
          </button>
        </div>
      </div>
    </div>
  );
}
