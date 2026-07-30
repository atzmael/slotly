import { describe, expect, it } from "vitest";
import {
  cleanupStaleEvents,
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
  type StaleEventCleanupRepository,
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
    eventId: string,
    participantId: string,
    windows: readonly AvailabilityInsert[],
  ) => Promise<"replaced" | "participant_not_found">,
): AvailabilityRepository {
  return {
    replaceAvailability: onReplace,
  };
}

function createFakeParticipantRepository(
  onInsert: (
    participant: ParticipantInsert,
  ) => Promise<{ readonly id: string }>,
  existingParticipant: {
    readonly id: string;
    readonly name: string;
  } | null = null,
): ParticipantRepository {
  return {
    async findParticipantByNormalizedName() {
      return existingParticipant;
    },
    insertParticipant: onInsert,
  };
}

function createFakeStaleEventCleanupRepository(
  onDelete: (retentionDays: number) => Promise<number>,
): StaleEventCleanupRepository {
  return {
    deleteStaleEvents: onDelete,
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
        startTime: "18:00",
        endTime: "22:00",
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
        start_time: "18:00",
        end_time: "22:00",
        duration_minutes: 60,
        slot_size_minutes: 30,
        is_full_day: false,
      },
    ]);
  });

  it("validates and persists a full-day event", async () => {
    const inserted: EventInsert[] = [];
    const result = await createEvent(
      {
        title: " Friends Weekend ",
        startDate: "2026-06-19",
        endDate: "2026-06-21",
        startTime: "",
        endTime: "",
        durationMinutes: Number.NaN,
        slotSizeMinutes: Number.NaN,
        isFullDay: true,
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
        title: "Friends Weekend",
        start_date: "2026-06-19",
        end_date: "2026-06-21",
        start_time: "00:00",
        end_time: "23:59",
        duration_minutes: 60,
        slot_size_minutes: 60,
        is_full_day: true,
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
        startTime: "22:00",
        endTime: "18:00",
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
        "time_range_invalid",
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
        startTime: "18:00",
        endTime: "22:00",
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

  it("maps missing event time columns to a migration error", async () => {
    const result = await createEvent(
      {
        title: "Board Game Night",
        startDate: "2026-06-15",
        endDate: "2026-06-21",
        startTime: "18:00",
        endTime: "22:00",
        durationMinutes: 120,
        slotSizeMinutes: 60,
      },
      createFakeRepository(async () => {
        throw {
          code: "PGRST204",
          message:
            "Could not find the 'start_time' column of 'events' in the schema cache",
        };
      }),
    );

    expect(result).toEqual({
      ok: false,
      errors: ["database_migration_required"],
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
              start_time: "18:00",
              end_time: "22:00",
              duration_minutes: 120,
              slot_size_minutes: 60,
              is_full_day: false,
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
          startTime: "18:00",
          endTime: "22:00",
          durationMinutes: 120,
          slotSizeMinutes: 60,
          isFullDay: false,
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
        normalized_name: "mael",
        timezone: "Europe/Paris",
      },
    ]);
  });

  it("reconnects an existing participant when the trimmed name matches exactly", async () => {
    let didInsert = false;
    const result = await joinEvent(
      {
        eventId: "374eb478-4ff2-4b84-9107-7c90dfb714ff",
        name: " Mael ",
        timezone: "Europe/Paris",
      },
      createFakeParticipantRepository(
        async () => {
          didInsert = true;
          return { id: "unused" };
        },
        { id: "1c17ce6f-62d2-450a-b30b-ce2a5fc1b3f3", name: "Mael" },
      ),
    );

    expect(result).toEqual({
      ok: true,
      participantId: "1c17ce6f-62d2-450a-b30b-ce2a5fc1b3f3",
    });
    expect(didInsert).toBe(false);
  });

  it("rejects a participant name already used with different casing or accents", async () => {
    let didInsert = false;
    const result = await joinEvent(
      {
        eventId: "374eb478-4ff2-4b84-9107-7c90dfb714ff",
        name: "maël",
        timezone: "Europe/Paris",
      },
      createFakeParticipantRepository(
        async () => {
          didInsert = true;
          return { id: "unused" };
        },
        { id: "1c17ce6f-62d2-450a-b30b-ce2a5fc1b3f3", name: "Mael" },
      ),
    );

    expect(result).toEqual({
      ok: false,
      errors: ["participant_name_taken"],
    });
    expect(didInsert).toBe(false);
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
      readonly eventId: string;
      readonly participantId: string;
      readonly windows: readonly AvailabilityInsert[];
    }> = [];
    const result = await saveAvailability(
      {
        eventId: "374eb478-4ff2-4b84-9107-7c90dfb714ff",
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
      createFakeAvailabilityRepository(
        async (eventId, participantId, windows) => {
          replacements.push({ eventId, participantId, windows });
          return "replaced";
        },
      ),
    );

    expect(result).toEqual({ ok: true });
    expect(replacements).toEqual([
      {
        eventId: "374eb478-4ff2-4b84-9107-7c90dfb714ff",
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

  it("allows clearing all availability windows", async () => {
    const replacements: Array<{
      readonly eventId: string;
      readonly participantId: string;
      readonly windows: readonly AvailabilityInsert[];
    }> = [];
    const result = await saveAvailability(
      {
        eventId: "374eb478-4ff2-4b84-9107-7c90dfb714ff",
        participantId: "1c17ce6f-62d2-450a-b30b-ce2a5fc1b3f3",
        windows: [],
      },
      createFakeAvailabilityRepository(
        async (eventId, participantId, windows) => {
          replacements.push({ eventId, participantId, windows });
          return "replaced";
        },
      ),
    );

    expect(result).toEqual({ ok: true });
    expect(replacements).toEqual([
      {
        eventId: "374eb478-4ff2-4b84-9107-7c90dfb714ff",
        participantId: "1c17ce6f-62d2-450a-b30b-ce2a5fc1b3f3",
        windows: [],
      },
    ]);
  });

  it("rejects invalid participant ids and windows before writing", async () => {
    let didReplace = false;
    const result = await saveAvailability(
      {
        eventId: "abc123",
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
        return "replaced";
      }),
    );

    expect(result).toEqual({
      ok: false,
      errors: [
        "event_id_invalid",
        "participant_id_invalid",
        "availability_window_invalid",
      ],
    });
    expect(didReplace).toBe(false);
  });

  it("rejects participants that do not belong to the event", async () => {
    let didAttemptReplace = false;
    const result = await saveAvailability(
      {
        eventId: "374eb478-4ff2-4b84-9107-7c90dfb714ff",
        participantId: "1c17ce6f-62d2-450a-b30b-ce2a5fc1b3f3",
        windows: [],
      },
      createFakeAvailabilityRepository(async () => {
        didAttemptReplace = true;
        return "participant_not_found";
      }),
    );

    expect(result).toEqual({
      ok: false,
      errors: ["participant_id_invalid"],
    });
    expect(didAttemptReplace).toBe(true);
  });

  it("maps persistence failures to a safe error", async () => {
    const result = await saveAvailability(
      {
        eventId: "374eb478-4ff2-4b84-9107-7c90dfb714ff",
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

describe("cleanupStaleEvents", () => {
  it("deletes stale events with the default retention window", async () => {
    const retentionDaysSeen: number[] = [];
    const result = await cleanupStaleEvents(
      {},
      createFakeStaleEventCleanupRepository(async (retentionDays) => {
        retentionDaysSeen.push(retentionDays);
        return 3;
      }),
    );

    expect(result).toEqual({
      ok: true,
      deletedCount: 3,
    });
    expect(retentionDaysSeen).toEqual([14]);
  });

  it("rejects invalid retention windows before deleting", async () => {
    let didDelete = false;
    const result = await cleanupStaleEvents(
      { retentionDays: 0 },
      createFakeStaleEventCleanupRepository(async () => {
        didDelete = true;
        return 0;
      }),
    );

    expect(result).toEqual({
      ok: false,
      errors: ["retention_days_invalid"],
    });
    expect(didDelete).toBe(false);
  });

  it("maps cleanup failures to a safe error", async () => {
    const result = await cleanupStaleEvents(
      {},
      createFakeStaleEventCleanupRepository(async () => {
        throw new Error("database unavailable");
      }),
    );

    expect(result).toEqual({
      ok: false,
      errors: ["cleanup_stale_events_failed"],
    });
  });
});
