import { describe, expect, it } from "vitest";
import { consumeRateLimit } from "./rate-limit";

describe("consumeRateLimit", () => {
  it("blocks create event attempts above the per-IP window", () => {
    const clientIp = "198.51.100.10";

    for (let index = 0; index < 5; index += 1) {
      expect(consumeRateLimit("create_event", clientIp, 1_000)).toBe(true);
    }

    expect(consumeRateLimit("create_event", clientIp, 1_000)).toBe(false);
  });

  it("keeps limits isolated by action and IP", () => {
    const now = 2_000;

    for (let index = 0; index < 5; index += 1) {
      expect(consumeRateLimit("create_event", "198.51.100.11", now)).toBe(true);
    }

    expect(consumeRateLimit("create_event", "198.51.100.11", now)).toBe(false);
    expect(consumeRateLimit("create_event", "198.51.100.12", now)).toBe(true);
    expect(consumeRateLimit("join_event", "198.51.100.11", now)).toBe(true);
  });

  it("resets after the action window expires", () => {
    const clientIp = "198.51.100.13";

    for (let index = 0; index < 5; index += 1) {
      expect(consumeRateLimit("create_event", clientIp, 3_000)).toBe(true);
    }

    expect(consumeRateLimit("create_event", clientIp, 3_000)).toBe(false);
    expect(consumeRateLimit("create_event", clientIp, 603_001)).toBe(true);
  });
});
