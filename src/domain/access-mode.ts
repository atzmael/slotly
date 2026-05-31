export const appAccessModes = [
  "public",
  "landing_only",
  "whitelist",
  "maintenance",
] as const;

export type AppAccessMode = (typeof appAccessModes)[number];

export type RouteAccess = "public" | "poll_interaction" | "mutation";

export type BlockedAccessReason = "development" | "maintenance" | "preview";

export type AppAccessDecision =
  | {
      readonly allowed: true;
      readonly mode: AppAccessMode;
      readonly routeAccess: RouteAccess;
    }
  | {
      readonly allowed: false;
      readonly mode: Exclude<AppAccessMode, "public">;
      readonly routeAccess: Exclude<RouteAccess, "public">;
      readonly reason: BlockedAccessReason;
    };

const publicPathnames = new Set(["/", "/privacy", "/terms"]);

export function parseAppAccessMode(value: string | undefined): AppAccessMode {
  if (value === undefined || value.length === 0) {
    return "public";
  }

  if (appAccessModes.includes(value as AppAccessMode)) {
    return value as AppAccessMode;
  }

  throw new Error(`Invalid APP_ACCESS_MODE: ${value}`);
}

export function classifyRoute(pathname: string): RouteAccess {
  if (publicPathnames.has(pathname) || pathname.endsWith("/results")) {
    return "public";
  }

  if (pathname.startsWith("/api/")) {
    return "mutation";
  }

  if (pathname === "/new" || /^\/e\/[^/]+$/.test(pathname)) {
    return "poll_interaction";
  }

  return "public";
}

export function getBlockedAccessReason(
  mode: Exclude<AppAccessMode, "public">,
): BlockedAccessReason {
  if (mode === "maintenance") {
    return "maintenance";
  }

  if (mode === "whitelist") {
    return "preview";
  }

  return "development";
}

export function resolveAppAccess(
  mode: AppAccessMode,
  pathname: string,
): AppAccessDecision {
  const routeAccess = classifyRoute(pathname);

  if (mode === "public" || routeAccess === "public") {
    return {
      allowed: true,
      mode,
      routeAccess,
    };
  }

  return {
    allowed: false,
    mode,
    routeAccess,
    reason: getBlockedAccessReason(mode),
  };
}
