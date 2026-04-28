"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useShake } from "./useShake";
import { useLogoClicks } from "./useLogoClicks";
import { useOpendataCode } from "./useOpendataCode";
import { ComplaintModal } from "./ComplaintModal";
import { BadgeToast } from "./BadgeToast";
import { MotionPrompt } from "./MotionPrompt";
import { OpendataToast } from "./OpendataToast";

export function ChickenWingProvider() {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(
      "%cNYCGRID SURVEILLANCE NODE v3.1.4\n%c// AUTHORIZED PERSONNEL ONLY\n// Badge required after 23:00\n// Unauthorized access is logged and reported to B.R.A.K.E.\n// Source: data.cityofnewyork.us/Transportation | webcams.nyctmc.org",
      "color:#e5e5e5;font-family:monospace;font-size:13px;font-weight:bold;",
      "color:#6b7280;font-family:monospace;font-size:11px;"
    );
  }, []);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [badgeOpen, setBadgeOpen] = useState(false);
  const [opendataOpen, setOpendataOpen] = useState(false);

  const openComplaint = useCallback(() => setComplaintOpen(true), []);
  const closeComplaint = useCallback(() => setComplaintOpen(false), []);
  const openBadge = useCallback(() => setBadgeOpen(true), []);
  const closeBadge = useCallback(() => setBadgeOpen(false), []);
  const openOpendata = useCallback(() => setOpendataOpen(true), []);
  const closeOpendata = useCallback(() => setOpendataOpen(false), []);

  const { requestMotionPermission } = useShake(openComplaint);
  useLogoClicks(openBadge);
  useOpendataCode(openOpendata);

  if (!mounted) return null;

  return createPortal(
    <>
      <ComplaintModal open={complaintOpen} onClose={closeComplaint} />
      <BadgeToast open={badgeOpen} onClose={closeBadge} />
      <OpendataToast open={opendataOpen} onClose={closeOpendata} />
      {requestMotionPermission && (
        <MotionPrompt requestMotionPermission={requestMotionPermission} />
      )}
    </>,
    document.body
  );
}
