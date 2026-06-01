import {
  isValidTimeZone,
  validateEventDraft,
  type EventDraft,
} from "../domain/availability";
import type { Json } from "./db/types";
import { createServiceSupabaseClient } from "./supabase";

export interface EventInsert {
  readonly title: string;
  readonly start_date: string;
  readonly end_date: string;
  readonly duration_minutes: number;
  readonly slot_size_minutes: number;
}

export interface CreateEventRepository {
  readonly insertEvent: (event: EventInsert) => Promise<{ readonly id: string }>;
}

export interface EventSnapshotRepository {
  readonly getEventSnapshot: (eventId: string) => Promise<Json>;
}

export interface ParticipantRepository {
  readonly insertParticipant: (
    participant: ParticipantInsert,
  ) => Promise<{ readonly id: string }>;
}

export interface ParticipantInsert {
  readonly event_id: string;
  readonly name: string;
  readonly timezone: string;
}

export interface SlotlyEvent {
  readonly id: string;
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
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
      duration_minutes: validation.value.durationMinutes,
      slot_size_minutes: validation.value.slotSizeMinutes,
    });

    return {
      ok: true,
      eventId: event.id,
    };
  } catch {
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
    const participant = await repository.insertParticipant({
      event_id: input.eventId,
      name,
      timezone: input.timezone,
    });

    return {
      ok: true,
      participantId: participant.id,
    };
  } catch {
    return {
      ok: false,
      errors: ["join_event_failed"],
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

function asNumber(value: Json | undefined): number {
  if (typeof value !== "number") {
    throw new Error("Expected number");
  }

  return value;
}
