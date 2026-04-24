"use client";

import { useMemo, useState, useCallback, useId, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LocateFixed,
  Loader2,
  Plus,
  Minus,
  Shuffle,
  X,
  Star,
  Bike,
  ListChecks,
  ArrowRight,
  Check,
} from "lucide-react";
import { motion, useReducedMotion, useDragControls } from "motion/react";
import type { PanInfo } from "motion/react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Camera, CameraArea } from "@/lib/cameras/types";

import { classifyCameraType } from "@/lib/cameras/classify";
import { MAX_COLLECTION_SIZE, encodeCameraIds } from "@/lib/collections/data";

type CameraType = "all" | "street" | "bridge" | "highway" | "tunnel";

const TYPE_LABELS: Record<CameraType, string> = {
  all: "All",
  street: "Street",
  bridge: "Bridge",
  highway: "Highway",
  tunnel: "Tunnel",
};

const CAMERA_TYPES: CameraType[] = ["all", "street", "bridge", "highway", "tunnel"];
import { useMapSetup } from "./useMapSetup";
import { CameraPanel } from "./CameraPanel";
import { useThemeStore, THEME_ACCENTS } from "@/features/theme/useThemeStore";
import { ThemeToggle } from "@/features/theme/ThemeToggle";
import { FEATURED_CAMERAS } from "@/features/context/lib/featured-cameras";
import { CoverageToggle, useCoverageLayer } from "@/features/coverage-gap";
import { YourStats } from "@/features/stats/YourStats";
import { findNearestCamera } from "@/lib/cameras/geo";
import { useFavourites } from "@/hooks/useFavourites";

type LocateState = "idle" | "locating" | "error";

const BOROUGHS: CameraArea[] = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];

const BOROUGH_LABEL: Record<CameraArea, string> = {
  Manhattan: "Manhattan",
  Brooklyn: "Brooklyn",
  Queens: "Queens",
  Bronx: "The Bronx",
  "Staten Island": "Staten Island",
};

const BOROUGH_CENTER: Record<CameraArea, [number, number]> = {
  Manhattan: [-73.9712, 40.7831],
  Brooklyn: [-73.9442, 40.6782],
  Queens: [-73.7949, 40.7282],
  Bronx: [-73.8648, 40.8448],
  "Staten Island": [-74.1502, 40.5795],
};

const VALID_TYPES = new Set<CameraType>(["all", "street", "bridge", "highway", "tunnel"]);
const VALID_BOROUGHS = new Set<CameraArea>([
  "Manhattan",
  "Brooklyn",
  "Queens",
  "Bronx",
  "Staten Island",
]);

interface MapViewProps {
  cameras: Camera[];
  initialCameraId?: string;
  initialQuery?: string;
  initialBorough?: string;
  initialType?: string;
  citibikeCameraIds?: Set<string>;
}

export function MapView({
  cameras,
  initialCameraId,
  initialQuery,
  initialBorough,
  initialType,
  citibikeCameraIds,
}: MapViewProps) {
  const router = useRouter();
  const initialResolved = useRef(false);
  const favouritesApi = useFavourites() as ReturnType<typeof useFavourites> & {
    addMany?: (ids: string[]) => void;
  };
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(() => {
    if (!initialCameraId) return null;
    return cameras.find((c) => c.id === initialCameraId) ?? null;
  });
  const [locateState, setLocateState] = useState<LocateState>("idle");
  const [query, setQuery] = useState(initialQuery ?? "");
  const [selectedBorough, setSelectedBorough] = useState<CameraArea | null>(
    initialBorough && VALID_BOROUGHS.has(initialBorough as CameraArea)
      ? (initialBorough as CameraArea)
      : null
  );
  const [selectedType, setSelectedType] = useState<CameraType>(
    initialType && VALID_TYPES.has(initialType as CameraType) ? (initialType as CameraType) : "all"
  );
  const [nearCitibike, setNearCitibike] = useState(false);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const { theme } = useThemeStore();
  const { favourites, toggle } = favouritesApi;
  const searchInputRef = useRef<HTMLInputElement>(null);

  const accentColor = THEME_ACCENTS[theme] ?? THEME_ACCENTS.street;
  const isLight = theme === "light";
  const queryPushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (queryPushTimer.current) clearTimeout(queryPushTimer.current);
    },
    []
  );

  const featuredIds = useMemo(() => new Set(FEATURED_CAMERAS.map((c) => c.id)), []);

  const pushParams = useCallback(
    (
      overrides: Partial<{
        camera: string | null;
        q: string;
        borough: string | null;
        type: CameraType;
      }>
    ) => {
      const url = new URL(window.location.href);
      const setOrDelete = (key: string, val: string | null | undefined) => {
        if (val) url.searchParams.set(key, val);
        else url.searchParams.delete(key);
      };
      if ("camera" in overrides) setOrDelete("camera", overrides.camera ?? null);
      if ("q" in overrides) setOrDelete("q", overrides.q || null);
      if ("borough" in overrides) setOrDelete("borough", overrides.borough ?? null);
      if ("type" in overrides)
        setOrDelete("type", overrides.type === "all" ? null : (overrides.type ?? null));
      router.replace(url.pathname + url.search, { scroll: false });
    },
    [router]
  );

  const selectCamera = useCallback(
    (camera: Camera | null) => {
      setSelectedCamera(camera);
      pushParams({ camera: camera?.id ?? null });
    },
    [pushParams]
  );

  const handleQueryChange = useCallback(
    (q: string) => {
      setQuery(q);
      if (queryPushTimer.current) clearTimeout(queryPushTimer.current);
      queryPushTimer.current = setTimeout(() => pushParams({ q }), 300);
    },
    [pushParams]
  );

  const handleTypeChange = useCallback(
    (type: CameraType) => {
      setSelectedType(type);
      pushParams({ type });
    },
    [pushParams]
  );

  const handleNearCitibikeToggle = useCallback(() => {
    setNearCitibike((prev) => !prev);
  }, []);

  const handleAddManyFavourites = useCallback(
    (ids: string[]) => {
      if (!ids.length) return;
      if (typeof favouritesApi.addMany === "function") {
        favouritesApi.addMany(ids);
        return;
      }
      ids.forEach((id) => {
        if (!favourites.has(id)) toggle(id);
      });
    },
    [favourites, favouritesApi, toggle]
  );

  const { containerRef, mapRef, flyTo, zoomIn, zoomOut, filterByBorough } = useMapSetup({
    cameras,
    featuredIds,
    accentColor,
    isLight,
    onCameraSelect: selectCamera,
  });

  // Fly to the initial camera once the map is ready
  useEffect(() => {
    if (initialResolved.current || !initialCameraId) return;
    const cam = cameras.find((c) => c.id === initialCameraId);
    if (!cam) return;
    initialResolved.current = true;
    flyTo([cam.longitude, cam.latitude], 15);
  }, [cameras, initialCameraId, flyTo]);

  // Bottom-nav "Browse" button opens the panel
  useEffect(() => {
    const handler = () => setMobileListOpen(true);
    window.addEventListener("map:openBrowser", handler);
    return () => window.removeEventListener("map:openBrowser", handler);
  }, []);

  // Cmd/Ctrl+K or "/" focuses the search input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        setMobileListOpen(true);
        searchInputRef.current?.focus();
      } else if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setMobileListOpen(true);
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const { enabled: coverageEnabled, toggle: coverageToggle } = useCoverageLayer(mapRef);

  const sortedCameras = useMemo(
    () =>
      [...cameras].sort(
        (left, right) => left.area.localeCompare(right.area) || left.name.localeCompare(right.name)
      ),
    [cameras]
  );

  const starredCameras = useMemo(
    () =>
      sortedCameras.filter((c) => {
        if (!favourites.has(c.id)) return false;
        if (selectedBorough && c.area !== selectedBorough) return false;
        if (selectedType !== "all" && classifyCameraType(c.name) !== selectedType) return false;
        if (nearCitibike && citibikeCameraIds && !citibikeCameraIds.has(c.id)) return false;
        const q = query.trim().toLowerCase();
        if (q) {
          const haystack = `${c.name} ${c.area} ${c.id}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      }),
    [
      sortedCameras,
      favourites,
      selectedBorough,
      selectedType,
      nearCitibike,
      citibikeCameraIds,
      query,
    ]
  );

  const filteredCameras = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let result = selectedBorough
      ? sortedCameras.filter((c) => c.area === selectedBorough)
      : sortedCameras;
    if (selectedType !== "all") {
      result = result.filter((c) => classifyCameraType(c.name) === selectedType);
    }
    if (nearCitibike && citibikeCameraIds) {
      result = result.filter((c) => citibikeCameraIds.has(c.id));
    }
    if (!normalizedQuery) return result;
    return result.filter((camera) => {
      const haystack = `${camera.name} ${camera.area} ${camera.id}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [query, sortedCameras, selectedBorough, selectedType, nearCitibike, citibikeCameraIds]);

  const handleBoroughSelect = useCallback(
    (borough: CameraArea) => {
      const next = selectedBorough === borough ? null : borough;
      setSelectedBorough(next);
      filterByBorough(next);
      pushParams({ borough: next });
      if (next) flyTo(BOROUGH_CENTER[next], 12);
    },
    [selectedBorough, filterByBorough, flyTo, pushParams]
  );

  const handleCameraBrowseSelect = useCallback(
    (camera: Camera) => {
      selectCamera(camera);
      flyTo([camera.longitude, camera.latitude], 15);
      setMobileListOpen(false);
    },
    [flyTo, selectCamera]
  );

  const handleSurpriseMe = useCallback(() => {
    const online = cameras.filter((c) => c.isOnline);
    if (!online.length) return;
    const pick = online[Math.floor(Math.random() * online.length)];
    flyTo([pick.longitude, pick.latitude], 15);
    selectCamera(pick);
  }, [cameras, flyTo, selectCamera]);

  const handleFindMe = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocateState("error");
      return;
    }
    if (navigator.permissions) {
      const perm = await navigator.permissions.query({ name: "geolocation" as PermissionName });
      if (perm.state === "denied") {
        setLocateState("error");
        return;
      }
    }
    setLocateState("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = findNearestCamera(pos.coords.latitude, pos.coords.longitude, cameras);
        if (!nearest) {
          setLocateState("error");
          return;
        }
        flyTo([nearest.longitude, nearest.latitude]);
        selectCamera(nearest);
        setLocateState("idle");
      },
      () => setLocateState("error"),
      { timeout: 10_000, maximumAge: 60_000 }
    );
  }, [cameras, flyTo, selectCamera]);

  const zoomBtnCls =
    "flex items-center justify-center w-11 h-11 border font-mono text-sm transition-colors shadow-sm";
  const mapCtrlStyle = {
    backgroundColor: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text-primary)",
  };

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* ── Desktop: camera browser fills the full left column ── */}
      <div className="absolute top-[60px] left-4 bottom-4 z-50 hidden md:flex flex-col w-80 lg:w-96">
        <CameraBrowsePanel
          cameras={filteredCameras}
          starredCameras={starredCameras}
          selectedCameraId={selectedCamera?.id ?? null}
          isMobileOpen={false}
          onCloseMobile={() => {}}
          onQueryChange={handleQueryChange}
          onSelectCamera={handleCameraBrowseSelect}
          onSurpriseMe={handleSurpriseMe}
          query={query}
          selectedType={selectedType}
          onTypeChange={handleTypeChange}
          nearCitibike={nearCitibike}
          onNearCitibikeToggle={handleNearCitibikeToggle}
          hasCitibikeData={!!citibikeCameraIds?.size}
          searchInputRef={searchInputRef}
          isDesktopInline
          favourites={favourites}
          onToggleFavourite={toggle}
          onAddManyFavourites={handleAddManyFavourites}
        />
      </div>

      {/* ── Desktop: zoom + find-me cluster — bottom-right, steps left when camera panel is open ── */}
      <div
        className={`absolute bottom-20 z-50 hidden md:flex flex-col items-end gap-1 transition-[right] duration-300 ${selectedCamera ? "right-[456px] xl:right-[496px]" : "right-4"}`}
      >
        <CoverageToggle enabled={coverageEnabled} onToggle={coverageToggle} />
        <button
          onClick={handleFindMe}
          disabled={locateState === "locating"}
          aria-label={
            locateState === "error"
              ? "Location unavailable — check browser permissions"
              : "Find nearest camera to your location"
          }
          title={
            locateState === "error"
              ? "Location unavailable — check browser permissions"
              : "Find nearest camera to your location"
          }
          className="flex items-center justify-center w-11 h-11 rounded border transition-colors disabled:cursor-not-allowed shadow-sm"
          style={{
            backgroundColor:
              locateState === "error" ? "var(--color-elevated)" : "var(--color-surface)",
            color: locateState === "error" ? "var(--color-offline)" : "var(--color-text-primary)",
            borderColor: locateState === "error" ? "var(--color-offline)" : "var(--color-border)",
          }}
          onMouseLeave={() => {
            if (locateState === "error") setLocateState("idle");
          }}
        >
          {locateState === "locating" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LocateFixed className="w-4 h-4" />
          )}
        </button>
        <div className="flex flex-col">
          <button
            onClick={zoomIn}
            aria-label="Zoom in"
            className={`${zoomBtnCls} rounded-t rounded-b-none border-b-0`}
            style={mapCtrlStyle}
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={zoomOut}
            aria-label="Zoom out"
            className={`${zoomBtnCls} rounded-b rounded-t-none`}
            style={mapCtrlStyle}
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Mobile: action buttons top-left ── */}
      <div
        className={`md:hidden absolute top-4 left-4 z-50 flex flex-col gap-2 ${mobileListOpen || selectedCamera ? "hidden" : ""}`}
      >
        <button
          onClick={handleFindMe}
          disabled={locateState === "locating"}
          title={locateState === "error" ? "Location unavailable" : "Find nearest camera"}
          className="flex items-center gap-1.5 font-mono text-xs px-3 min-h-[44px] rounded border transition-colors disabled:cursor-not-allowed shadow-sm"
          style={{
            backgroundColor:
              locateState === "error" ? "var(--color-elevated)" : "var(--color-surface)",
            color: locateState === "error" ? "var(--color-offline)" : "var(--color-text-primary)",
            borderColor: locateState === "error" ? "var(--color-offline)" : "var(--color-border)",
          }}
          onMouseLeave={() => {
            if (locateState === "error") setLocateState("idle");
          }}
        >
          {locateState === "locating" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LocateFixed className="w-3.5 h-3.5" />
          )}
          {locateState === "locating"
            ? "Locating…"
            : locateState === "error"
              ? "Unavailable"
              : "Find me"}
        </button>
        <button
          onClick={handleSurpriseMe}
          title="Jump to a random online camera"
          className="flex items-center gap-1.5 font-mono text-xs px-3 min-h-[44px] rounded border transition-colors shadow-sm"
          style={mapCtrlStyle}
        >
          <Shuffle className="w-3.5 h-3.5" />
          Surprise me
        </button>
      </div>

      {/* Theme toggle + zoom cluster — mobile top-right ── */}
      <div
        className={`md:hidden absolute top-4 right-4 z-50 flex flex-col items-end gap-2 ${mobileListOpen || selectedCamera ? "hidden" : ""}`}
      >
        <ThemeToggle />
        <CoverageToggle enabled={coverageEnabled} onToggle={coverageToggle} showLegend={false} />
        <div className="flex flex-col">
          <button
            onClick={zoomIn}
            aria-label="Zoom in"
            className={`${zoomBtnCls} rounded-t rounded-b-none border-b-0`}
            style={mapCtrlStyle}
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={zoomOut}
            aria-label="Zoom out"
            className={`${zoomBtnCls} rounded-b rounded-t-none`}
            style={mapCtrlStyle}
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile camera browser drawer */}
      <CameraBrowsePanel
        cameras={filteredCameras}
        starredCameras={starredCameras}
        selectedCameraId={selectedCamera?.id ?? null}
        isMobileOpen={mobileListOpen}
        onCloseMobile={() => setMobileListOpen(false)}
        onQueryChange={handleQueryChange}
        onSelectCamera={handleCameraBrowseSelect}
        onSurpriseMe={handleSurpriseMe}
        query={query}
        selectedType={selectedType}
        onTypeChange={handleTypeChange}
        nearCitibike={nearCitibike}
        onNearCitibikeToggle={handleNearCitibikeToggle}
        hasCitibikeData={!!citibikeCameraIds?.size}
        searchInputRef={searchInputRef}
        selectedBorough={selectedBorough}
        onBoroughSelect={handleBoroughSelect}
        favourites={favourites}
        onToggleFavourite={toggle}
        onAddManyFavourites={handleAddManyFavourites}
      />

      {/* Borough filter pills — desktop only; mobile boroughs live inside the camera drawer */}
      <div
        className={`absolute bottom-16 left-1/2 z-50 hidden -translate-x-1/2 gap-2 overflow-x-auto px-2 scrollbar-none md:flex ${selectedCamera ? "md:hidden" : "max-w-[calc(100vw-2rem)]"}`}
        role="group"
        aria-label="Filter by borough"
      >
        {BOROUGHS.map((borough) => {
          const isActive = selectedBorough === borough;
          return (
            <button
              key={borough}
              onClick={() => handleBoroughSelect(borough)}
              aria-pressed={isActive}
              className="shrink-0 font-mono text-xs font-medium px-4 py-2.5 min-h-[44px] rounded-full border transition-colors whitespace-nowrap shadow-sm"
              style={{
                backgroundColor: isActive ? "var(--color-accent)" : "var(--color-surface)",
                borderColor: isActive ? "var(--color-accent)" : "var(--color-border)",
                color: isActive ? "var(--color-on-accent)" : "var(--color-text-primary)",
              }}
            >
              {BOROUGH_LABEL[borough]}
            </button>
          );
        })}
      </div>

      <CameraPanel camera={selectedCamera} onClose={() => selectCamera(null)} />
    </div>
  );
}

interface CameraBrowsePanelProps {
  cameras: Camera[];
  starredCameras: Camera[];
  selectedCameraId: string | null;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onQueryChange: (query: string) => void;
  onSelectCamera: (camera: Camera) => void;
  onSurpriseMe: () => void;
  query: string;
  selectedType: CameraType;
  onTypeChange: (type: CameraType) => void;
  nearCitibike?: boolean;
  onNearCitibikeToggle?: () => void;
  hasCitibikeData?: boolean;
  isDesktopInline?: boolean;
  selectedBorough?: CameraArea | null;
  onBoroughSelect?: (borough: CameraArea) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  favourites: Set<string>;
  onToggleFavourite: (cameraId: string) => void;
  onAddManyFavourites: (cameraIds: string[]) => void;
}

export function CameraBrowsePanel({
  cameras,
  starredCameras,
  selectedCameraId,
  isMobileOpen,
  onCloseMobile,
  onQueryChange,
  onSelectCamera,
  onSurpriseMe,
  query,
  selectedType,
  onTypeChange,
  nearCitibike,
  onNearCitibikeToggle,
  hasCitibikeData,
  isDesktopInline = false,
  selectedBorough,
  onBoroughSelect,
  searchInputRef,
  favourites,
  onToggleFavourite,
  onAddManyFavourites,
}: CameraBrowsePanelProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const dragControls = useDragControls();
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedCameraIds, setSelectedCameraIds] = useState<string[]>([]);

  // Adjust state during render: clear select mode when the panel closes.
  const isPanelOpen = isDesktopInline || isMobileOpen;
  const [prevPanelOpen, setPrevPanelOpen] = useState(isPanelOpen);
  if (prevPanelOpen !== isPanelOpen) {
    setPrevPanelOpen(isPanelOpen);
    if (!isPanelOpen && (isSelectMode || selectedCameraIds.length > 0)) {
      setIsSelectMode(false);
      setSelectedCameraIds([]);
    }
  }
  const selectedCameraIdSet = useMemo(() => new Set(selectedCameraIds), [selectedCameraIds]);

  const clearSelection = useCallback(() => {
    setSelectedCameraIds([]);
  }, []);

  const exitSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedCameraIds([]);
  }, []);

  const toggleCameraSelection = useCallback((cameraId: string) => {
    setSelectedCameraIds((prev) => {
      if (prev.includes(cameraId)) {
        return prev.filter((id) => id !== cameraId);
      }
      if (prev.length >= MAX_COLLECTION_SIZE) {
        return prev;
      }
      return [...prev, cameraId];
    });
  }, []);

  const handleBuildCollection = useCallback(() => {
    if (!selectedCameraIds.length) return;
    const encodedIds = encodeURIComponent(encodeCameraIds(selectedCameraIds));
    router.push(`/collections/build?c=${encodedIds}`);
  }, [router, selectedCameraIds]);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const { velocity, offset } = info;
      if (velocity.y > 400 || offset.y > 80) {
        onCloseMobile();
      }
    },
    [onCloseMobile]
  );

  useEffect(() => {
    if (!isSelectMode) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      exitSelectMode();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [exitSelectMode, isSelectMode]);

  if (isDesktopInline) {
    return (
      <section
        aria-label="Browse cameras"
        className="flex-1 min-h-0 flex flex-col border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-base)_90%,transparent)] shadow-xl backdrop-blur-sm rounded-xl"
      >
        <PanelContents
          cameras={cameras}
          starredCameras={starredCameras}
          selectedCameraId={selectedCameraId}
          query={query}
          onQueryChange={onQueryChange}
          onSelectCamera={onSelectCamera}
          onSurpriseMe={onSurpriseMe}
          onCloseMobile={onCloseMobile}
          showCloseButton={false}
          showBoroughFilter={false}
          selectedType={selectedType}
          onTypeChange={onTypeChange}
          nearCitibike={nearCitibike ?? false}
          onNearCitibikeToggle={onNearCitibikeToggle ?? (() => {})}
          hasCitibikeData={hasCitibikeData ?? false}
          selectedBorough={null}
          onBoroughSelect={() => {}}
          searchInputRef={searchInputRef}
          isSelectMode={isSelectMode}
          selectedCameraIds={selectedCameraIds}
          selectedCameraIdSet={selectedCameraIdSet}
          onEnterSelectMode={() => setIsSelectMode(true)}
          onExitSelectMode={exitSelectMode}
          onClearSelection={clearSelection}
          onToggleSelectCamera={toggleCameraSelection}
          onBuildCollection={handleBuildCollection}
          onAddManyFavourites={onAddManyFavourites}
          favourites={favourites}
          onToggleFavourite={onToggleFavourite}
        />
      </section>
    );
  }

  return (
    <>
      {isMobileOpen ? (
        <button
          type="button"
          aria-label="Close camera browser"
          onClick={onCloseMobile}
          className="md:hidden absolute inset-0 z-55 bg-black/50"
        />
      ) : null}

      {isMobileOpen ? (
        <motion.section
          aria-label="Browse cameras"
          className="absolute z-60 flex flex-col border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-base)_90%,transparent)] shadow-xl backdrop-blur-sm left-2 right-2 bottom-14 top-4 rounded-2xl"
          drag={shouldReduceMotion ? false : "y"}
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.05, bottom: 0.3 }}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          transition={
            shouldReduceMotion
              ? { duration: 0.12 }
              : { type: "spring", damping: 32, stiffness: 300, mass: 0.8 }
          }
        >
          {/* Drag handle */}
          <div
            className="flex justify-center items-center h-6 shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <div className="w-9 h-1 rounded-full bg-[var(--color-border)]" />
          </div>
          <PanelContents
            cameras={cameras}
            starredCameras={starredCameras}
            selectedCameraId={selectedCameraId}
            query={query}
            onQueryChange={onQueryChange}
            onSelectCamera={onSelectCamera}
            onSurpriseMe={onSurpriseMe}
            onCloseMobile={onCloseMobile}
            showCloseButton
            showBoroughFilter
            selectedType={selectedType}
            onTypeChange={onTypeChange}
            nearCitibike={nearCitibike ?? false}
            onNearCitibikeToggle={onNearCitibikeToggle ?? (() => {})}
            hasCitibikeData={hasCitibikeData ?? false}
            selectedBorough={selectedBorough ?? null}
            onBoroughSelect={onBoroughSelect ?? (() => {})}
            searchInputRef={searchInputRef}
            isSelectMode={isSelectMode}
            selectedCameraIds={selectedCameraIds}
            selectedCameraIdSet={selectedCameraIdSet}
            onEnterSelectMode={() => setIsSelectMode(true)}
            onExitSelectMode={exitSelectMode}
            onClearSelection={clearSelection}
            onToggleSelectCamera={toggleCameraSelection}
            onBuildCollection={handleBuildCollection}
            onAddManyFavourites={onAddManyFavourites}
            favourites={favourites}
            onToggleFavourite={onToggleFavourite}
          />
        </motion.section>
      ) : null}
    </>
  );
}

interface PanelContentsProps {
  cameras: Camera[];
  starredCameras: Camera[];
  selectedCameraId: string | null;
  query: string;
  onQueryChange: (q: string) => void;
  onSelectCamera: (c: Camera) => void;
  onSurpriseMe: () => void;
  onCloseMobile: () => void;
  showCloseButton: boolean;
  showBoroughFilter: boolean;
  selectedType: CameraType;
  onTypeChange: (type: CameraType) => void;
  nearCitibike: boolean;
  onNearCitibikeToggle: () => void;
  hasCitibikeData: boolean;
  selectedBorough: CameraArea | null;
  onBoroughSelect: (borough: CameraArea) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  isSelectMode: boolean;
  selectedCameraIds: string[];
  selectedCameraIdSet: Set<string>;
  onEnterSelectMode: () => void;
  onExitSelectMode: () => void;
  onClearSelection: () => void;
  onToggleSelectCamera: (cameraId: string) => void;
  onBuildCollection: () => void;
  onAddManyFavourites: (cameraIds: string[]) => void;
  favourites: Set<string>;
  onToggleFavourite: (cameraId: string) => void;
}

function arrowNav<T>(items: T[], current: T | null, direction: "prev" | "next"): T {
  const idx = current !== null ? items.indexOf(current) : -1;
  const next =
    direction === "next" ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
  return items[next];
}

function PanelContents({
  cameras,
  starredCameras,
  selectedCameraId,
  query,
  onQueryChange,
  onSelectCamera,
  onSurpriseMe,
  onCloseMobile,
  showCloseButton,
  showBoroughFilter,
  selectedType,
  onTypeChange,
  nearCitibike,
  onNearCitibikeToggle,
  hasCitibikeData,
  selectedBorough,
  onBoroughSelect,
  searchInputRef,
  isSelectMode,
  selectedCameraIds,
  selectedCameraIdSet,
  onEnterSelectMode,
  onExitSelectMode,
  onClearSelection,
  onToggleSelectCamera,
  onBuildCollection,
  onAddManyFavourites,
  favourites,
  onToggleFavourite,
}: PanelContentsProps) {
  const searchId = useId();
  // cameras and starredCameras are pre-filtered by MapView (query, borough, type)
  const visibleStarredIds = useMemo(
    () => new Set(starredCameras.map((camera) => camera.id)),
    [starredCameras]
  );
  const visibleCameras = useMemo(
    () => cameras.filter((camera) => !visibleStarredIds.has(camera.id)),
    [cameras, visibleStarredIds]
  );
  const visibleStarred = starredCameras;
  const isSelectionFull = selectedCameraIds.length >= MAX_COLLECTION_SIZE;

  const handleTypePillKey = (e: React.KeyboardEvent, type: CameraType) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      onTypeChange(arrowNav(CAMERA_TYPES, type, "next"));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      onTypeChange(arrowNav(CAMERA_TYPES, type, "prev"));
    }
  };

  const handleBoroughPillKey = (e: React.KeyboardEvent, borough: CameraArea) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      onBoroughSelect(arrowNav(BOROUGHS, borough, "next"));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      onBoroughSelect(arrowNav(BOROUGHS, borough, "prev"));
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <div className="min-w-0">
          <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
            Camera browser
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {(visibleCameras.length + visibleStarred.length).toString()} camera
            {visibleCameras.length + visibleStarred.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onSurpriseMe}
            title="Jump to a random online camera"
            aria-label="Surprise me — jump to a random camera"
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-3 text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${showCloseButton ? "w-11 px-0" : "min-w-[140px]"}`}
          >
            <Shuffle className="w-4 h-4" />
            {!showCloseButton ? (
              <span className="font-mono text-xs uppercase tracking-widest">Surprise Me</span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={isSelectMode ? onExitSelectMode : onEnterSelectMode}
            aria-label={isSelectMode ? "Exit select mode" : "Enter select mode"}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
              isSelectMode
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            }`}
          >
            <ListChecks className="w-4 h-4" />
          </button>
          {showCloseButton && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close camera browser"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <label
          htmlFor={searchId}
          className="mb-2 block font-mono text-xs text-[var(--color-text-muted)]"
        >
          Search cameras
        </label>
        <input
          ref={searchInputRef}
          id={searchId}
          name="camera_search"
          type="search"
          inputMode="search"
          autoComplete="off"
          placeholder="Search by name, borough, or ID…"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        />
        <div
          className="flex gap-1.5 mt-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Filter by camera type"
        >
          {CAMERA_TYPES.map((type) => {
            const isActive = selectedType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onTypeChange(type)}
                onKeyDown={(e) => handleTypePillKey(e, type)}
                aria-pressed={isActive}
                className="shrink-0 font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded border transition-colors"
                style={{
                  backgroundColor: isActive ? "var(--color-elevated)" : "transparent",
                  borderColor: isActive ? "var(--color-accent)" : "var(--color-border)",
                  color: isActive ? "var(--color-accent)" : "var(--color-text-muted)",
                }}
              >
                {TYPE_LABELS[type]}
              </button>
            );
          })}
          {hasCitibikeData && (
            <button
              type="button"
              onClick={onNearCitibikeToggle}
              aria-pressed={nearCitibike}
              className="shrink-0 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded border transition-colors"
              style={{
                backgroundColor: nearCitibike ? "var(--color-elevated)" : "transparent",
                borderColor: nearCitibike ? "var(--color-accent)" : "var(--color-border)",
                color: nearCitibike ? "var(--color-accent)" : "var(--color-text-muted)",
              }}
            >
              <Bike className="w-3 h-3" />
              Near Citibike
            </button>
          )}
        </div>

        {showBoroughFilter && (
          <div
            className="flex gap-1.5 mt-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Filter by borough"
          >
            {BOROUGHS.map((borough) => {
              const isActive = selectedBorough === borough;
              return (
                <button
                  key={borough}
                  type="button"
                  onClick={() => onBoroughSelect(borough)}
                  onKeyDown={(e) => handleBoroughPillKey(e, borough)}
                  aria-pressed={isActive}
                  className="shrink-0 font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded border transition-colors"
                  style={{
                    backgroundColor: isActive ? "var(--color-elevated)" : "transparent",
                    borderColor: isActive ? "var(--color-accent)" : "var(--color-border)",
                    color: isActive ? "var(--color-accent)" : "var(--color-text-muted)",
                  }}
                >
                  {BOROUGH_LABEL[borough]}
                </button>
              );
            })}
          </div>
        )}

        {isSelectMode ? (
          <div className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-secondary)]">
                {selectedCameraIds.length} selected
              </span>
              <button
                type="button"
                onClick={() => onAddManyFavourites(selectedCameraIds)}
                disabled={selectedCameraIds.length === 0}
                className="inline-flex min-h-[36px] items-center justify-center rounded-md border border-[var(--color-border)] px-3 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Favourite selected
              </button>
              <button
                type="button"
                onClick={onBuildCollection}
                disabled={selectedCameraIds.length === 0}
                className="inline-flex min-h-[36px] items-center justify-center rounded-md border border-[var(--color-border)] px-3 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Build collection
              </button>
              <button
                type="button"
                onClick={onClearSelection}
                className="inline-flex min-h-[36px] items-center justify-center rounded-md border border-[var(--color-border)] px-3 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                Clear
              </button>
            </div>
            {isSelectionFull ? (
              <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                Selection full. Collections are capped at {MAX_COLLECTION_SIZE} cameras. Clear one
                to add another.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto p-2">
        {visibleStarred.length > 0 && (
          <>
            <li className="px-3 pt-2 pb-1">
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
                <Star className="w-3 h-3" style={{ color: "var(--color-accent)" }} />
                Starred
              </span>
            </li>
            {visibleStarred.map((camera) => (
              <CameraListItem
                key={`starred-${camera.id}`}
                camera={camera}
                isSelected={selectedCameraId === camera.id}
                onSelect={onSelectCamera}
                isSelectMode={isSelectMode}
                isChecked={selectedCameraIdSet.has(camera.id)}
                isSelectionDisabled={isSelectionFull && !selectedCameraIdSet.has(camera.id)}
                onToggleSelection={onToggleSelectCamera}
                isFavourite={favourites.has(camera.id)}
                onToggleFavourite={onToggleFavourite}
              />
            ))}
            <li className="px-3 pt-3 pb-1">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
                All cameras
              </span>
            </li>
          </>
        )}
        {visibleCameras.length ? (
          visibleCameras.map((camera) => (
            <CameraListItem
              key={camera.id}
              camera={camera}
              isSelected={selectedCameraId === camera.id}
              onSelect={onSelectCamera}
              isSelectMode={isSelectMode}
              isChecked={selectedCameraIdSet.has(camera.id)}
              isSelectionDisabled={isSelectionFull && !selectedCameraIdSet.has(camera.id)}
              onToggleSelection={onToggleSelectCamera}
              isFavourite={favourites.has(camera.id)}
              onToggleFavourite={onToggleFavourite}
            />
          ))
        ) : (
          <li className="px-3 py-4 text-sm text-[var(--color-text-secondary)]">
            No cameras match that search yet.
          </li>
        )}
      </ul>
      {!query && selectedType === "all" && !nearCitibike && !selectedBorough && (
        <div className="shrink-0 border-t border-[var(--color-border)] p-3">
          <YourStats />
        </div>
      )}
    </>
  );
}

function CameraListItem({
  camera,
  isSelected,
  onSelect,
  isSelectMode,
  isChecked,
  isSelectionDisabled,
  onToggleSelection,
  isFavourite,
  onToggleFavourite,
}: {
  camera: Camera;
  isSelected: boolean;
  onSelect: (c: Camera) => void;
  isSelectMode: boolean;
  isChecked: boolean;
  isSelectionDisabled: boolean;
  onToggleSelection: (cameraId: string) => void;
  isFavourite: boolean;
  onToggleFavourite: (cameraId: string) => void;
}) {
  return (
    <li className="rounded-lg" style={{ contentVisibility: "auto", containIntrinsicSize: "72px" }}>
      <div
        className="flex items-start gap-2 rounded-lg border px-3 py-3 hover:border-[var(--color-border)] hover:bg-[var(--color-surface)]"
        style={{
          borderColor: isSelected ? "var(--color-accent)" : "transparent",
          backgroundColor: isSelected ? "var(--color-surface)" : "transparent",
        }}
      >
        {isSelectMode ? (
          <button
            type="button"
            role="checkbox"
            aria-checked={isChecked}
            aria-label={`Select ${camera.name}`}
            disabled={isSelectionDisabled}
            onClick={() => onToggleSelection(camera.id)}
            className={`inline-flex min-h-[44px] w-10 shrink-0 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              isChecked
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            }`}
          >
            {isChecked ? <Check className="w-3.5 h-3.5" /> : null}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            if (isSelectMode) {
              onToggleSelection(camera.id);
              return;
            }
            onSelect(camera);
          }}
          aria-pressed={isSelected}
          className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-sm text-[var(--color-text-primary)] truncate">
              {camera.name}
            </span>
            <span
              className="inline-flex h-2 w-2 rounded-full shrink-0"
              style={{
                backgroundColor: camera.isOnline ? "var(--color-online)" : "var(--color-offline)",
              }}
            />
          </div>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">
            {camera.area}
          </p>
          {isSelected ? (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-[var(--color-accent)]">
              Selected
            </p>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => onToggleFavourite(camera.id)}
          aria-label={`${isFavourite ? "Remove" : "Add"} ${camera.name} ${isFavourite ? "from" : "to"} favourites`}
          className="inline-flex min-h-[44px] w-10 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          <Star
            className="w-4 h-4"
            fill={isFavourite ? "currentColor" : "none"}
            style={{ color: isFavourite ? "var(--color-accent)" : undefined }}
          />
        </button>
        <Link
          href={`/camera/${camera.id}`}
          aria-label={`Open ${camera.name}`}
          className="shrink-0 inline-flex h-11 w-10 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </li>
  );
}
