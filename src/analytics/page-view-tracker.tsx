"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import type { Locale } from "@/i18n/messages";
import { trackEvent } from "./client";
import {
  getDeviceType,
  resolveRoutePattern,
  type AnalyticsRoutePattern,
} from "./events";

interface PageViewTrackerProps {
  readonly locale: Locale;
}

export function PageViewTracker({ locale }: PageViewTrackerProps) {
  return (
    <Suspense fallback={null}>
      <PageViewTrackerContent locale={locale} />
    </Suspense>
  );
}

function PageViewTrackerContent({ locale }: PageViewTrackerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lastTrackedPathname = useRef<string | null>(null);
  const hasTrackedCreatedEvent = useRef(false);

  useEffect(() => {
    const routePattern = resolveRoutePattern(pathname);
    const properties = {
      device_type: getDeviceType(window.innerWidth),
      locale,
      route_pattern: routePattern,
    } as const;

    if (lastTrackedPathname.current !== pathname) {
      lastTrackedPathname.current = pathname;
      trackEvent({
        name: getViewEventName(routePattern),
        properties,
      });
    }

    if (
      searchParams.get("created") === "1" &&
      !hasTrackedCreatedEvent.current
    ) {
      hasTrackedCreatedEvent.current = true;
      trackEvent({
        name: "event.created",
        properties,
      });
      router.replace(pathname, { scroll: false });
    }
  }, [locale, pathname, router, searchParams]);

  return null;
}

function getViewEventName(
  routePattern: AnalyticsRoutePattern,
): "home.viewed" | "create.viewed" | "event.viewed" | "results.viewed" {
  if (routePattern === "/new") {
    return "create.viewed";
  }

  if (routePattern === "/e/[eventId]") {
    return "event.viewed";
  }

  if (routePattern === "/e/[eventId]/results") {
    return "results.viewed";
  }

  return "home.viewed";
}
