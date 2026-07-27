import { describe, expect, it } from "vitest";
import { getDeviceType, resolveRoutePattern } from "./events";

describe("resolveRoutePattern", () => {
  it("keeps public route patterns stable", () => {
    expect(resolveRoutePattern("/")).toBe("/");
    expect(resolveRoutePattern("/new")).toBe("/new");
  });

  it("removes public event ids from event routes", () => {
    expect(resolveRoutePattern("/e/374eb478-4ff2-4b84-9107-7c90dfb714ff")).toBe(
      "/e/[eventId]",
    );
    expect(
      resolveRoutePattern("/e/374eb478-4ff2-4b84-9107-7c90dfb714ff/results"),
    ).toBe("/e/[eventId]/results");
  });

  it("returns unknown for unsupported routes", () => {
    expect(resolveRoutePattern("/internal/abc123")).toBe("unknown");
  });
});

describe("getDeviceType", () => {
  it("classifies common viewport widths", () => {
    expect(getDeviceType(390)).toBe("mobile");
    expect(getDeviceType(768)).toBe("tablet");
    expect(getDeviceType(1280)).toBe("desktop");
  });
});
