import { describe, expect, it } from "vitest";
import {
  classifyRoute,
  getBlockedAccessReason,
  parseAppAccessMode,
  resolveAppAccess,
} from "./access-mode";

describe("parseAppAccessMode", () => {
  it("defaults to public when unset", () => {
    expect(parseAppAccessMode(undefined)).toBe("public");
    expect(parseAppAccessMode("")).toBe("public");
  });

  it("accepts supported modes", () => {
    expect(parseAppAccessMode("public")).toBe("public");
    expect(parseAppAccessMode("landing_only")).toBe("landing_only");
    expect(parseAppAccessMode("whitelist")).toBe("whitelist");
    expect(parseAppAccessMode("maintenance")).toBe("maintenance");
  });

  it("rejects unknown modes", () => {
    expect(() => parseAppAccessMode("closed")).toThrow(
      "Invalid APP_ACCESS_MODE: closed",
    );
  });
});

describe("classifyRoute", () => {
  it("keeps read-only public pages public", () => {
    expect(classifyRoute("/")).toBe("public");
    expect(classifyRoute("/terms")).toBe("public");
    expect(classifyRoute("/e/abc123/results")).toBe("public");
  });

  it("classifies poll interaction pages", () => {
    expect(classifyRoute("/new")).toBe("poll_interaction");
    expect(classifyRoute("/e/abc123")).toBe("poll_interaction");
  });

  it("classifies API routes as mutations", () => {
    expect(classifyRoute("/api/events")).toBe("mutation");
    expect(classifyRoute("/api/availability")).toBe("mutation");
  });
});

describe("getBlockedAccessReason", () => {
  it("maps restricted modes to display reasons", () => {
    expect(getBlockedAccessReason("landing_only")).toBe("development");
    expect(getBlockedAccessReason("maintenance")).toBe("maintenance");
    expect(getBlockedAccessReason("whitelist")).toBe("preview");
  });
});

describe("resolveAppAccess", () => {
  it("allows poll interactions in public mode", () => {
    expect(resolveAppAccess("public", "/new")).toEqual({
      allowed: true,
      mode: "public",
      routeAccess: "poll_interaction",
    });
  });

  it("allows read-only results in restricted modes", () => {
    expect(resolveAppAccess("maintenance", "/e/abc123/results")).toEqual({
      allowed: true,
      mode: "maintenance",
      routeAccess: "public",
    });
  });

  it("blocks creation and participation outside public mode", () => {
    expect(resolveAppAccess("landing_only", "/new")).toEqual({
      allowed: false,
      mode: "landing_only",
      routeAccess: "poll_interaction",
      reason: "development",
    });

    expect(resolveAppAccess("maintenance", "/api/events")).toEqual({
      allowed: false,
      mode: "maintenance",
      routeAccess: "mutation",
      reason: "maintenance",
    });
  });
});
