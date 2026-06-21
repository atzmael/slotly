import { describe, expect, it } from "vitest";
import {
  isValidTimeZone,
  normalizeParticipantName,
  rankAvailabilitySlots,
  validateEventDraft,
  type Participant,
} from "./availability";

const participants: Participant[] = [
  { id: "p1", name: "Mael", timezone: "Europe/Paris" },
  { id: "p2", name: "Lucas", timezone: "Europe/Paris" },
  { id: "p3", name: "Emma", timezone: "America/New_York" },
];

describe("validateEventDraft", () => {
  it("accepts the MVP event fields", () => {
    expect(
      validateEventDraft({
        title: " Raid WoW ",
        startDate: "2026-06-15",
        endDate: "2026-06-21",
        startTime: "18:00",
        endTime: "22:00",
        durationMinutes: 120,
        slotSizeMinutes: 60,
      }),
    ).toEqual({
      valid: true,
      value: {
        title: "Raid WoW",
        startDate: "2026-06-15",
        endDate: "2026-06-21",
        startTime: "18:00",
        endTime: "22:00",
        durationMinutes: 120,
        slotSizeMinutes: 60,
      },
    });
  });

  it("rejects invalid ranges and unsupported options", () => {
    expect(
      validateEventDraft({
        title: "",
        startDate: "2026-06-21",
        endDate: "2026-06-15",
        startTime: "22:00",
        endTime: "18:00",
        durationMinutes: 45,
        slotSizeMinutes: 15,
      }),
    ).toEqual({
      valid: false,
      errors: [
        "title_required",
        "date_range_invalid",
        "duration_invalid",
        "slot_size_invalid",
        "time_range_invalid",
      ],
    });
  });

  it("rejects event durations that do not fit inside the time range", () => {
    expect(
      validateEventDraft({
        title: "Raid WoW",
        startDate: "2026-06-15",
        endDate: "2026-06-15",
        startTime: "18:00",
        endTime: "19:00",
        durationMinutes: 120,
        slotSizeMinutes: 30,
      }),
    ).toEqual({
      valid: false,
      errors: ["duration_exceeds_time_range"],
    });
  });
});

describe("normalizeParticipantName", () => {
  it("normalizes whitespace, case, and accents", () => {
    expect(normalizeParticipantName("  Maël   A ")).toBe("mael a");
  });
});

describe("isValidTimeZone", () => {
  it("accepts real IANA timezones", () => {
    expect(isValidTimeZone("Europe/Paris")).toBe(true);
    expect(isValidTimeZone("America/New_York")).toBe(true);
  });

  it("rejects unknown timezones", () => {
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
  });
});

describe("rankAvailabilitySlots", () => {
  it("generates valid windows from the product brief example", () => {
    const ranked = rankAvailabilitySlots({
      participants: [participants[0]],
      availability: [
        {
          participantId: "p1",
          start: "2026-06-16T18:00:00.000Z",
          end: "2026-06-16T22:00:00.000Z",
        },
      ],
      durationMinutes: 120,
      slotSizeMinutes: 60,
    });

    expect(
      ranked.map((slot) => ({
        start: slot.start,
        end: slot.end,
        availableCount: slot.availableCount,
      })),
    ).toEqual([
      {
        start: "2026-06-16T18:00:00.000Z",
        end: "2026-06-16T20:00:00.000Z",
        availableCount: 1,
      },
      {
        start: "2026-06-16T19:00:00.000Z",
        end: "2026-06-16T21:00:00.000Z",
        availableCount: 1,
      },
      {
        start: "2026-06-16T20:00:00.000Z",
        end: "2026-06-16T22:00:00.000Z",
        availableCount: 1,
      },
    ]);
  });

  it("sorts by highest attendance and exposes present and absent participants", () => {
    const ranked = rankAvailabilitySlots({
      participants,
      availability: [
        {
          participantId: "p1",
          start: "2026-06-16T18:00:00.000Z",
          end: "2026-06-16T22:00:00.000Z",
        },
        {
          participantId: "p2",
          start: "2026-06-16T19:00:00.000Z",
          end: "2026-06-16T21:00:00.000Z",
        },
        {
          participantId: "p3",
          start: "2026-06-16T20:00:00.000Z",
          end: "2026-06-16T22:00:00.000Z",
        },
      ],
      durationMinutes: 60,
      slotSizeMinutes: 60,
    });

    expect(ranked[0]).toMatchObject({
      start: "2026-06-16T20:00:00.000Z",
      end: "2026-06-16T21:00:00.000Z",
      availableCount: 3,
    });
    expect(ranked[0]?.availableParticipants.map((p) => p.name)).toEqual([
      "Mael",
      "Lucas",
      "Emma",
    ]);
    expect(ranked[0]?.missingParticipants).toEqual([]);

    expect(ranked.at(-1)).toMatchObject({
      start: "2026-06-16T18:00:00.000Z",
      availableCount: 1,
    });
    expect(ranked.at(-1)?.missingParticipants.map((p) => p.name)).toEqual([
      "Lucas",
      "Emma",
    ]);
  });

  it("deduplicates candidate slots contributed by multiple people", () => {
    const ranked = rankAvailabilitySlots({
      participants: participants.slice(0, 2),
      availability: [
        {
          participantId: "p1",
          start: "2026-06-16T18:00:00.000Z",
          end: "2026-06-16T20:00:00.000Z",
        },
        {
          participantId: "p2",
          start: "2026-06-16T18:00:00.000Z",
          end: "2026-06-16T20:00:00.000Z",
        },
      ],
      durationMinutes: 60,
      slotSizeMinutes: 60,
    });

    expect(ranked).toHaveLength(2);
    expect(ranked.map((slot) => slot.availableCount)).toEqual([2, 2]);
  });

  it("merges adjacent availability windows before ranking", () => {
    const ranked = rankAvailabilitySlots({
      participants: [participants[0]],
      availability: [
        {
          participantId: "p1",
          start: "2026-06-16T18:00:00.000Z",
          end: "2026-06-16T18:30:00.000Z",
        },
        {
          participantId: "p1",
          start: "2026-06-16T18:30:00.000Z",
          end: "2026-06-16T19:00:00.000Z",
        },
      ],
      durationMinutes: 60,
      slotSizeMinutes: 30,
    });

    expect(ranked).toHaveLength(1);
    expect(ranked[0]).toMatchObject({
      start: "2026-06-16T18:00:00.000Z",
      end: "2026-06-16T19:00:00.000Z",
      availableCount: 1,
    });
  });

  it("throws on unknown participants and invalid windows", () => {
    expect(() =>
      rankAvailabilitySlots({
        participants,
        availability: [
          {
            participantId: "missing",
            start: "2026-06-16T18:00:00.000Z",
            end: "2026-06-16T20:00:00.000Z",
          },
        ],
        durationMinutes: 60,
        slotSizeMinutes: 60,
      }),
    ).toThrow("Unknown participant: missing");

    expect(() =>
      rankAvailabilitySlots({
        participants,
        availability: [
          {
            participantId: "p1",
            start: "2026-06-16T20:00:00.000Z",
            end: "2026-06-16T18:00:00.000Z",
          },
        ],
        durationMinutes: 60,
        slotSizeMinutes: 60,
      }),
    ).toThrow("Availability window end must be after start");
  });
});
