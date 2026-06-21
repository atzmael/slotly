import {
  isValidTimeZone,
  normalizeParticipantName,
  validateEventDraft,
  type EventDraft,
} from "../domain/availability";
import type { Json } from "./db/types";
import { createServiceSupabaseClient } from "./supabase";

export interface EventInsert {
  readonly title: string;
  readonly start_date: string;
  readonly end_date: string;
  readonly start_time: string;
  readonly end_time: string;
  readonly duration_minutes: number;
  readonly slot_size_minutes: number;
}

export interface CreateEventRepository {
  readonly insertEvent: (
    event: EventInsert,
  ) => Promise<{ readonly id: string }>;
}

export interface EventSnapshotRepository {
  readonly getEventSnapshot: (eventId: string) => Promise<Json>;
}

export interface ParticipantRepository {
  readonly findParticipantByNormalizedName: (
    eventId: string,
    normalizedName: string,
  ) => Promise<{ readonly id: string; readonly name: string } | null>;
  readonly insertParticipant: (
    participant: ParticipantInsert,
  ) => Promise<{ readonly id: string }>;
}

export interface AvailabilityRepository {
  readonly replaceAvailability: (
    participantId: string,
    windows: readonly AvailabilityInsert[],
  ) => Promise<void>;
}

export interface ParticipantInsert {
  readonly event_id: string;
  readonly name: string;
  readonly normalized_name: string;
  readonly timezone: string;
}

export interface AvailabilityInsert {
  readonly participant_id: string;
  readonly start_at: string;
  readonly end_at: string;
}

export interface SlotlyEvent {
  readonly id: string;
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly durationMinutes: number;
  readonly slotSizeMinutes: number;
  readonly createdAt: string;
}

export interface EventParticipant {
  readonly id: string;
  readonly eventId: string;
  readonly name: string;
  readonly timezone: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface EventAvailabilityWindow {
  readonly id: string;
  readonly participantId: string;
  readonly start: string;
  readonly end: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface EventSnapshot {
  readonly event: SlotlyEvent;
  readonly participants: readonly EventParticipant[];
  readonly availabilityWindows: readonly EventAvailabilityWindow[];
}

export type CreateEventResult =
  | {
      readonly ok: true;
      readonly eventId: string;
    }
  | {
      readonly ok: false;
      readonly errors: readonly string[];
    };

export type GetEventSnapshotResult =
  | {
      readonly ok: true;
      readonly snapshot: EventSnapshot;
    }
  | {
      readonly ok: false;
      readonly reason: "invalid_event_id" | "not_found" | "load_failed";
    };

export type JoinEventResult =
  | {
      readonly ok: true;
      readonly participantId: string;
    }
  | {
      readonly ok: false;
      readonly errors: readonly string[];
    };

export type SaveAvailabilityResult =
  | {
      readonly ok: true;
    }
  | {
      readonly ok: false;
      readonly errors: readonly string[];
    };

export async function createEvent(
  draft: EventDraft,
  repository: CreateEventRepository = createSupabaseCreateEventRepository(),
): Promise<CreateEventResult> {
  const validation = validateEventDraft(draft);

  if (!validation.valid) {
    return {
      ok: false,
      errors: validation.errors,
    };
  }

  try {
    const event = await repository.insertEvent({
      title: validation.value.title,
      start_date: validation.value.startDate,
      end_date: validation.value.endDate,
      start_time: validation.value.startTime,
      end_time: validation.value.endTime,
      duration_minutes: validation.value.durationMinutes,
      slot_size_minutes: validation.value.slotSizeMinutes,
    });

    return {
      ok: true,
      eventId: event.id,
    };
  } catch (error) {
    if (isEventSchemaMigrationError(error)) {
      return {
        ok: false,
        errors: ["database_migration_required"],
      };
    }

    return {
      ok: false,
      errors: ["create_event_failed"],
    };
  }
}

export async function getEventSnapshot(
  eventId: string,
  repository: EventSnapshotRepository = createSupabaseEventSnapshotRepository(),
): Promise<GetEventSnapshotResult> {
  if (!isUuid(eventId)) {
    return { ok: false, reason: "invalid_event_id" };
  }

  try {
    const payload = await repository.getEventSnapshot(eventId);

    if (payload === null) {
      return { ok: false, reason: "not_found" };
    }

    return {
      ok: true,
      snapshot: parseEventSnapshot(payload),
    };
  } catch {
    return { ok: false, reason: "load_failed" };
  }
}

export async function joinEvent(
  input: {
    readonly eventId: string;
    readonly name: string;
    readonly timezone: string;
  },
  repository: ParticipantRepository = createSupabaseParticipantRepository(),
): Promise<JoinEventResult> {
  const errors: string[] = [];
  const name = input.name.trim();
  const normalizedName = normalizeParticipantName(name);

  if (!isUuid(input.eventId)) {
    errors.push("event_id_invalid");
  }

  if (name.length === 0) {
    errors.push("name_required");
  }

  if (name.length > 60) {
    errors.push("name_too_long");
  }

  if (!isValidTimeZone(input.timezone)) {
    errors.push("timezone_invalid");
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
    };
  }

  try {
    const existingParticipant =
      await repository.findParticipantByNormalizedName(
        input.eventId,
        normalizedName,
      );

    if (existingParticipant) {
      if (existingParticipant.name === name) {
        return {
          ok: true,
          participantId: existingParticipant.id,
        };
      }

      return {
        ok: false,
        errors: ["participant_name_taken"],
      };
    }

    const participant = await repository.insertParticipant({
      event_id: input.eventId,
      name,
      normalized_name: normalizedName,
      timezone: input.timezone,
    });

    return {
      ok: true,
      participantId: participant.id,
    };
  } catch (error) {
    if (isParticipantNameUniqueViolation(error)) {
      return {
        ok: false,
        errors: ["participant_name_taken"],
      };
    }

    return {
      ok: false,
      errors: ["join_event_failed"],
    };
  }
}

export async function saveAvailability(
  input: {
    readonly participantId: string;
    readonly windows: readonly {
      readonly start: string;
      readonly end: string;
    }[];
  },
  repository: AvailabilityRepository = createSupabaseAvailabilityRepository(),
): Promise<SaveAvailabilityResult> {
  const errors: string[] = [];

  if (!isUuid(input.participantId)) {
    errors.push("participant_id_invalid");
  }

  if (input.windows.length > 400) {
    errors.push("availability_too_large");
  }

  const windows = input.windows.map((window) => {
    const startMs = Date.parse(window.start);
    const endMs = Date.parse(window.end);

    if (Number.isNaN(startMs) || Number.isNaN(endMs) || startMs >= endMs) {
      errors.push("availability_window_invalid");
    }

    return {
      participant_id: input.participantId,
      start_at: window.start,
      end_at: window.end,
    };
  });

  if (errors.length > 0) {
    return {
      ok: false,
      errors: Array.from(new Set(errors)),
    };
  }

  try {
    await repository.replaceAvailability(input.participantId, windows);
    return { ok: true };
  } catch {
    return {
      ok: false,
      errors: ["save_availability_failed"],
    };
  }
}

function createSupabaseCreateEventRepository(): CreateEventRepository {
  return {
    async insertEvent(event) {
      const supabase = createServiceSupabaseClient();
      const { data, error } = await supabase
        .from("events")
        .insert(event)
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
  };
}

function createSupabaseEventSnapshotRepository(): EventSnapshotRepository {
  return {
    async getEventSnapshot(eventId) {
      const supabase = createServiceSupabaseClient();
      const { data, error } = await supabase.rpc("get_event_snapshot", {
        public_event_id: eventId,
      });

      if (error) {
        throw error;
      }

      return data;
    },
  };
}

function createSupabaseParticipantRepository(): ParticipantRepository {
  return {
    async findParticipantByNormalizedName(eventId, normalizedName) {
      const supabase = createServiceSupabaseClient();
      const { data, error } = await supabase
        .from("participants")
        .select("id, name")
        .eq("event_id", eventId)
        .eq("normalized_name", normalizedName)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    async insertParticipant(participant) {
      const supabase = createServiceSupabaseClient();
      const { data, error } = await supabase
        .from("participants")
        .insert(participant)
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
  };
}

function createSupabaseAvailabilityRepository(): AvailabilityRepository {
  return {
    async replaceAvailability(participantId, windows) {
      const supabase = createServiceSupabaseClient();
      const deleteResult = await supabase
        .from("availability_windows")
        .delete()
        .eq("participant_id", participantId);

      if (deleteResult.error) {
        throw deleteResult.error;
      }

      if (windows.length === 0) {
        return;
      }

      const insertResult = await supabase
        .from("availability_windows")
        .insert([...windows]);

      if (insertResult.error) {
        throw insertResult.error;
      }
    },
  };
}

function parseEventSnapshot(payload: Json): EventSnapshot {
  if (!isRecord(payload)) {
    throw new Error("Invalid event snapshot payload");
  }

  const event = asRecord(payload.event);
  const participants = asArray(payload.participants);
  const availabilityWindows = asArray(payload.availabilityWindows);

  return {
    event: {
      id: asString(event.id),
      title: asString(event.title),
      startDate: asString(event.start_date),
      endDate: asString(event.end_date),
      startTime: asTimeString(event.start_time ?? "18:00"),
      endTime: asTimeString(event.end_time ?? "22:00"),
      durationMinutes: asNumber(event.duration_minutes),
      slotSizeMinutes: asNumber(event.slot_size_minutes),
      createdAt: asString(event.created_at),
    },
    participants: participants.map((participant) => {
      const row = asRecord(participant);

      return {
        id: asString(row.id),
        eventId: asString(row.event_id),
        name: asString(row.name),
        timezone: asString(row.timezone),
        createdAt: asString(row.created_at),
        updatedAt: asString(row.updated_at),
      };
    }),
    availabilityWindows: availabilityWindows.map((availabilityWindow) => {
      const row = asRecord(availabilityWindow);

      return {
        id: asString(row.id),
        participantId: asString(row.participant_id),
        start: asString(row.start_at),
        end: asString(row.end_at),
        createdAt: asString(row.created_at),
        updatedAt: asString(row.updated_at),
      };
    }),
  };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isEventSchemaMigrationError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const code = "code" in error ? error.code : undefined;
  const message = "message" in error ? error.message : undefined;

  return (
    (code === "PGRST204" || code === "42703") &&
    typeof message === "string" &&
    (message.includes("start_time") || message.includes("end_time"))
  );
}

function isParticipantNameUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.includes("participants_event_id_normalized_name_key")
  );
}

function isRecord(value: Json | undefined): value is { [key: string]: Json } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: Json | undefined): { [key: string]: Json } {
  if (!isRecord(value)) {
    throw new Error("Expected object");
  }

  return value;
}

function asArray(value: Json | undefined): Json[] {
  if (!Array.isArray(value)) {
    throw new Error("Expected array");
  }

  return value;
}

function asString(value: Json | undefined): string {
  if (typeof value !== "string") {
    throw new Error("Expected string");
  }

  return value;
}

function asTimeString(value: Json | undefined): string {
  const time = asString(value);

  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
    throw new Error("Expected time string");
  }

  return time.slice(0, 5);
}

function asNumber(value: Json | undefined): number {
  if (typeof value !== "number") {
    throw new Error("Expected number");
  }

  return value;
}
