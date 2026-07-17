"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

// MapView mirrors its in-page state into the URL via history.replaceState as a
// permalink side-effect. Next.js surfaces those writes through useSearchParams,
// so counting them as navigations turns every map click, filter, and search
// keystroke into a $pageview.
const PERMALINK_PARAMS = ["camera", "q", "borough", "type", "neighborhood"];

function navigationKey(pathname: string, searchParams: URLSearchParams | null): string {
  const params = new URLSearchParams(searchParams?.toString() ?? "");
  for (const param of PERMALINK_PARAMS) params.delete(param);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();
  const key = navigationKey(pathname, searchParams);

  useEffect(() => {
    if (!posthog) return;
    // Read the live URL rather than the key — a genuine inbound deep link
    // (/explore?camera=…) should keep its params in the captured pageview.
    posthog.capture("$pageview", { $current_url: window.location.href });
  }, [key, posthog]);

  return null;
}
