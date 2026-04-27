"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useShake } from "./useShake";
import { useLogoClicks } from "./useLogoClicks";
import { ComplaintModal } from "./ComplaintModal";
import { BadgeToast } from "./BadgeToast";

export function ChickenWingProvider() {
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
