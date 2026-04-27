"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useShake } from "./useShake";
import { useLogoClicks } from "./useLogoClicks";
import { ComplaintModal } from "./ComplaintModal";
import { BadgeToast } from "./BadgeToast";

export function ChickenWingProvider() {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(
      "%cNYCGRID SURVEILLANCE NODE v3.1.4\n%c// AUTHORIZED PERSONNEL ONLY\n// Badge required after 23:00\n// Unauthorized access is logged and reported to B.R.A.K.E.",
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

  const openComplaint = useCallback(() => setComplaintOpen(true), []);
  const closeComplaint = useCallback(() => setComplaintOpen(false), []);
  const openBadge = useCallback(() => setBadgeOpen(true), []);
  const closeBadge = useCallback(() => setBadgeOpen(false), []);

  useShake(openComplaint);
  useLogoClicks(openBadge);

  if (!mounted) return null;

  return createPortal(
    <>
      <ComplaintModal open={complaintOpen} onClose={closeComplaint} />
      <BadgeToast open={badgeOpen} onClose={closeBadge} />
    </>,
    document.body
  );
}
