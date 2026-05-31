import { describe, expect, it } from "vitest";
import { createEvent, type EventInsert, type EventRepository } from "./events";

function createFakeRepository(
  onInsert: (event: EventInsert) => Promise<{ readonly id: string }>,
): EventRepository {
  return {
    insertEvent: onInsert,
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
