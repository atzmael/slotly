import { describe, expect, it } from "vitest";
import {
  createEvent,
  getEventSnapshot,
  joinEvent,
  saveAvailability,
  type AvailabilityInsert,
  type AvailabilityRepository,
  type CreateEventRepository,
  type EventInsert,
  type ParticipantInsert,
  type ParticipantRepository,
} from "./events";

function createFakeRepository(
  onInsert: (event: EventInsert) => Promise<{ readonly id: string }>,
): CreateEventRepository {
  return {
    insertEvent: onInsert,
  };
}

function createFakeAvailabilityRepository(
  onReplace: (
    participantId: string,
    windows: readonly AvailabilityInsert[],
  ) => Promise<void>,
): AvailabilityRepository {
  return {
    replaceAvailability: onReplace,
  };
}

function createFakeParticipantRepository(
  onInsert: (
    participant: ParticipantInsert,
  ) => Promise<{ readonly id: string }>,
): ParticipantRepository {
  return {
    insertParticipant: onInsert,
  };
}

describe("createEvent", () => {
  it("validates and persists an event", async () => {
    const inserted: EventInsert[] = [];
    const result = await createEvent(
      {
        title: " Team Meeting ",
        startDate: "2026-06-15",
        endDate: "2026-06-21",
        durationMinutes: 60,
        slotSizeMinutes: 30,
      },
      createFakeRepository(async (event) => {
        inserted.push(event);
        return { id: "9dcb8596-4785-4c57-9edc-f9bc0478fc39" };
      }),
    );

    expect(result).toEqual({
      ok: true,
      eventId: "9dcb8596-4785-4c57-9edc-f9bc0478fc39",
    });
    expect(inserted).toEqual([
      {
        title: "Team Meeting",
        start_date: "2026-06-15",
        end_date: "2026-06-21",
        duration_minutes: 60,
        slot_size_minutes: 30,
      },
    ]);
  });

  it("returns validation errors without writing", async () => {
    let didInsert = false;
    const result = await createEvent(
      {
        title: "",
        startDate: "2026-06-21",
        endDate: "2026-06-15",
        durationMinutes: 45,
        slotSizeMinutes: 15,
      },
      createFakeRepository(async () => {
        didInsert = true;
        return { id: "unused" };
      }),
    );

    expect(result).toEqual({
      ok: false,
      errors: [
        "title_required",
        "date_range_invalid",
        "duration_invalid",
        "slot_size_invalid",
      ],
    });
    expect(didInsert).toBe(false);
  });

  it("maps repository failures to a safe error", async () => {
    const result = await createEvent(
      {
        title: "Board Game Night",
        startDate: "2026-06-15",
        endDate: "2026-06-21",
        durationMinutes: 120,
        slotSizeMinutes: 60,
      },
      createFakeRepository(async () => {
        throw new Error("database unavailable");
      }),
    );

    expect(result).toEqual({
      ok: false,
      errors: ["create_event_failed"],
    });
  });
});

describe("getEventSnapshot", () => {
  it("loads and maps an event snapshot", async () => {
    const result = await getEventSnapshot(
      "374eb478-4ff2-4b84-9107-7c90dfb714ff",
      {
        async getEventSnapshot() {
          return {
            event: {
              id: "374eb478-4ff2-4b84-9107-7c90dfb714ff",
              title: "Board Game Night",
              start_date: "2026-06-15",
              end_date: "2026-06-21",
              duration_minutes: 120,
              slot_size_minutes: 60,
              created_at: "2026-06-01T00:00:00.000Z",
            },
            participants: [
              {
                id: "1c17ce6f-62d2-450a-b30b-ce2a5fc1b3f3",
                event_id: "374eb478-4ff2-4b84-9107-7c90dfb714ff",
                name: "Mael",
                timezone: "Europe/Paris",
                created_at: "2026-06-01T00:01:00.000Z",
                updated_at: "2026-06-01T00:01:00.000Z",
              },
            ],
            availabilityWindows: [],
          };
        },
      },
    );

    expect(result).toEqual({
      ok: true,
      snapshot: {
        event: {
          id: "374eb478-4ff2-4b84-9107-7c90dfb714ff",
          title: "Board Game Night",
          startDate: "2026-06-15",
          endDate: "2026-06-21",
          durationMinutes: 120,
          slotSizeMinutes: 60,
          createdAt: "2026-06-01T00:00:00.000Z",
        },
        participants: [
          {
            id: "1c17ce6f-62d2-450a-b30b-ce2a5fc1b3f3",
            eventId: "374eb478-4ff2-4b84-9107-7c90dfb714ff",
            name: "Mael",
            timezone: "Europe/Paris",
            createdAt: "2026-06-01T00:01:00.000Z",
            updatedAt: "2026-06-01T00:01:00.000Z",
          },
        ],
        availabilityWindows: [],
      },
    });
  });

  it("rejects invalid event ids before loading", async () => {
    const result = await getEventSnapshot("abc123", {
      async getEventSnapshot() {
        throw new Error("should not load");
      },
    });

    expect(result).toEqual({
      ok: false,
      reason: "invalid_event_id",
    });
  });
});

describe("joinEvent", () => {
  it("validates and inserts a participant", async () => {
    const inserted: ParticipantInsert[] = [];
    const result = await joinEvent(
      {
        eventId: "374eb478-4ff2-4b84-9107-7c90dfb714ff",
        name: " Mael ",
        timezone: "Europe/Paris",
      },
      createFakeParticipantRepository(async (participant) => {
        inserted.push(participant);
        return { id: "1c17ce6f-62d2-450a-b30b-ce2a5fc1b3f3" };
      }),
    );

    expect(result).toEqual({
      ok: true,
      participantId: "1c17ce6f-62d2-450a-b30b-ce2a5fc1b3f3",
    });
    expect(inserted).toEqual([
      {
        event_id: "374eb478-4ff2-4b84-9107-7c90dfb714ff",
        name: "Mael",
        timezone: "Europe/Paris",
      },
    ]);
  });

  it("returns validation errors without writing", async () => {
    let didInsert = false;
    const result = await joinEvent(
      {
        eventId: "abc123",
        name: "",
        timezone: "Mars/Olympus",
      },
      createFakeParticipantRepository(async () => {
        didInsert = true;
        return { id: "unused" };
      }),
    );

    expect(result).toEqual({
      ok: false,
      errors: ["event_id_invalid", "name_required", "timezone_invalid"],
    });
    expect(didInsert).toBe(false);
  });
});

describe("saveAvailability", () => {
  it("replaces a participant availability windows", async () => {
    const replacements: Array<{
      readonly participantId: string;
      readonly windows: readonly AvailabilityInsert[];
    }> = [];
    const result = await saveAvailability(
      {
        participantId: "1c17ce6f-62d2-450a-b30b-ce2a5fc1b3f3",
        windows: [
          {
            start: "2026-06-15T16:00:00.000Z",
            end: "2026-06-15T17:00:00.000Z",
          },
          {
            start: "2026-06-15T17:00:00.000Z",
            end: "2026-06-15T18:00:00.000Z",
          },
        ],
      },
      createFakeAvailabilityRepository(async (participantId, windows) => {
        replacements.push({ participantId, windows });
      }),
    );

    expect(result).toEqual({ ok: true });
    expect(replacements).toEqual([
      {
        participantId: "1c17ce6f-62d2-450a-b30b-ce2a5fc1b3f3",
        windows: [
          {
            participant_id: "1c17ce6f-62d2-450a-b30b-ce2a5fc1b3f3",
            start_at: "2026-06-15T16:00:00.000Z",
            end_at: "2026-06-15T17:00:00.000Z",
          },
          {
            participant_id: "1c17ce6f-62d2-450a-b30b-ce2a5fc1b3f3",
            start_at: "2026-06-15T17:00:00.000Z",
            end_at: "2026-06-15T18:00:00.000Z",
          },
        ],
      },
    ]);
  });

  it("rejects invalid participant ids and windows before writing", async () => {
    let didReplace = false;
    const result = await saveAvailability(
      {
        participantId: "not-a-uuid",
        windows: [
          {
            start: "2026-06-15T18:00:00.000Z",
            end: "2026-06-15T17:00:00.000Z",
          },
        ],
      },
      createFakeAvailabilityRepository(async () => {
        didReplace = true;
      }),
    );

    expect(result).toEqual({
      ok: false,
      errors: ["participant_id_invalid", "availability_window_invalid"],
    });
    expect(didReplace).toBe(false);
  });

  it("maps persistence failures to a safe error", async () => {
    const result = await saveAvailability(
      {
        participantId: "1c17ce6f-62d2-450a-b30b-ce2a5fc1b3f3",
        windows: [
          {
            start: "2026-06-15T16:00:00.000Z",
            end: "2026-06-15T17:00:00.000Z",
          },
        ],
      },
      createFakeAvailabilityRepository(async () => {
        throw new Error("database unavailable");
      }),
    );

    expect(result).toEqual({
      ok: false,
      errors: ["save_availability_failed"],
    });
  });
});
