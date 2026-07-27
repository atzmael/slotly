import type { Locale } from "@/i18n/messages";

export type AnalyticsRoutePattern =
  | "/"
  | "/new"
  | "/e/[eventId]"
  | "/e/[eventId]/results"
  | "/api/cron/cleanup-stale-events"
  | "unknown";

export type AnalyticsDeviceType = "mobile" | "tablet" | "desktop";

export interface AnalyticsBaseProperties {
  readonly route_pattern?: AnalyticsRoutePattern;
  readonly locale?: Locale;
  readonly device_type?: AnalyticsDeviceType;
}

export type AnalyticsEvent =
  | {
      readonly name:
        "home.viewed" | "create.viewed" | "event.viewed" | "results.viewed";
      readonly properties: AnalyticsBaseProperties;
    }
  | {
      readonly name: "locale.changed";
      readonly properties: AnalyticsBaseProperties & {
        readonly locale_from: Locale;
        readonly locale_to: Locale;
      };
    }
  | {
      readonly name: "create.started" | "create.submitted";
      readonly properties: AnalyticsBaseProperties & {
        readonly duration_minutes?: number;
        readonly slot_size_minutes?: number;
      };
    }
  | {
      readonly name: "event.created";
      readonly properties: AnalyticsBaseProperties;
    }
  | {
      readonly name: "share.clicked";
      readonly properties: AnalyticsBaseProperties & {
        readonly source: "event" | "results";
      };
    }
  | {
      readonly name: "join.submitted" | "participant.joined";
      readonly properties: AnalyticsBaseProperties & {
        readonly participants_count?: number;
      };
    }
  | {
      readonly name: "availability.started";
      readonly properties: AnalyticsBaseProperties & {
        readonly days_count: number;
        readonly slot_size_minutes: number;
      };
    }
  | {
      readonly name: "availability.quick_actions.opened";
      readonly properties: AnalyticsBaseProperties & {
        readonly days_count: number;
        readonly slot_size_minutes: number;
      };
    }
  | {
      readonly name: "availability.quick_actions.applied";
      readonly properties: AnalyticsBaseProperties & {
        readonly days_count: number;
        readonly slot_size_minutes: number;
        readonly scope: "all" | "weekdays";
      };
    }
  | {
      readonly name: "availability.saved";
      readonly properties: AnalyticsBaseProperties & {
        readonly days_count: number;
        readonly selected_slots_count: number;
        readonly slot_size_minutes: number;
      };
    };

export function resolveRoutePattern(pathname: string): AnalyticsRoutePattern {
  if (pathname === "/" || pathname === "/new") {
    return pathname;
  }

  if (/^\/e\/[^/]+\/results$/.test(pathname)) {
    return "/e/[eventId]/results";
  }

  if (/^\/e\/[^/]+$/.test(pathname)) {
    return "/e/[eventId]";
  }

  if (pathname === "/api/cron/cleanup-stale-events") {
    return "/api/cron/cleanup-stale-events";
  }

  return "unknown";
}

export function getDeviceType(width: number): AnalyticsDeviceType {
  if (width < 640) {
    return "mobile";
  }

  if (width < 1024) {
    return "tablet";
  }

  return "desktop";
}
