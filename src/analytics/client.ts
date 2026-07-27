"use client";

import posthog from "posthog-js";
import type { AnalyticsEvent } from "./events";

let initialized = false;

export function initializeAnalytics() {
  if (initialized || typeof window === "undefined") {
    return;
  }

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!key) {
    initialized = true;
    return;
  }

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    autocapture: false,
    capture_pageview: false,
    disable_session_recording: true,
    persistence: "localStorage+cookie",
  });
  initialized = true;
}

export function trackEvent(event: AnalyticsEvent) {
  initializeAnalytics();

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return;
  }

  posthog.capture(event.name, event.properties);
}
