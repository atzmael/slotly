import {
  isValidTimeZone,
  normalizeParticipantName,
  rankAvailabilitySlots,
  rankFullDayAvailabilitySlots,
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
  readonly is_full_day: boolean;
  readonly creator_token_hash: string;
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
  readonly getEventLockState: (
    eventId: string,
  ) => Promise<{ readonly finalized_at: string | null } | null>;
  readonly findParticipantByNormalizedName: (
    eventId: string,
    normalizedName: string,
  ) => Promise<{ readonly id: string; readonly name: string } | null>;
  readonly insertParticipant: (
    participant: ParticipantInsert,
  ) => Promise<{ readonly id: string }>;
}

export interface AvailabilityRepository {
  readonly getEventLockState: (
    eventId: string,
  ) => Promise<{ readonly finalized_at: string | null } | null>;
  readonly replaceAvailability: (
    eventId: string,
    participantId: string,
    windows: readonly AvailabilityInsert[],
  ) => Promise<"replaced" | "participant_not_found">;
}

export interface StaleEventCleanupRepository {
  readonly deleteStaleEvents: (retentionDays: number) => Promise<number>;
}

export interface EventFinalizationRepository {
  readonly getEventSnapshot: (eventId: string) => Promise<Json>;
  readonly getEventFinalizationState: (eventId: string) => Promise<{
    readonly id: string;
    readonly is_full_day: boolean;
    readonly creator_token_hash: string | null;
    readonly finalized_at: string | null;
  } | null>;
  readonly finalizeEvent: (
    eventId: string,
    finalStart: string,
    finalEnd: string,
  ) => Promise<void>;
  readonly cancelFinalization: (eventId: string) => Promise<void>;
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
  readonly isFullDay: boolean;
  readonly creatorTokenHash: string | null;
  readonly finalizedStart: string | null;
  readonly finalizedEnd: string | null;
  readonly finalizedAt: string | null;
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

export type CleanupStaleEventsResult =
  | {
      readonly ok: true;
      readonly deletedCount: number;
    }
  | {
      readonly ok: false;
      readonly errors: readonly string[];
    };

export type FinalizeEventResult =
  | {
      readonly ok: true;
    }
  | {
      readonly ok: false;
      readonly errors: readonly string[];
    };

export async function canManageEvent(
  input: {
    readonly eventId: string;
    readonly creatorTokenHash: string | null;
  },
  repository: Pick<
    EventFinalizationRepository,
    "getEventFinalizationState"
  > = createSupabaseEventFinalizationRepository(),
): Promise<boolean> {
  if (
    !isUuid(input.eventId) ||
    !input.creatorTokenHash ||
    input.creatorTokenHash.length !== 64
  ) {
    return false;
  }

  try {
    const event = await repository.getEventFinalizationState(input.eventId);

    return Boolean(
      event?.creator_token_hash &&
      event.creator_token_hash === input.creatorTokenHash,
    );
  } catch {
    return false;
  }
}

export async function createEvent(
  draft: EventDraft & { readonly creatorTokenHash: string },
  repository: CreateEventRepository = createSupabaseCreateEventRepository(),
): Promise<CreateEventResult> {
  const validation = validateEventDraft(draft);
  const creatorTokenHashValid = /^[0-9a-f]{64}$/i.test(draft.creatorTokenHash);

  if (!validation.valid || !creatorTokenHashValid) {
    return {
      ok: false,
      errors: [
        ...(validation.valid ? [] : validation.errors),
        ...(creatorTokenHashValid ? [] : ["creator_token_invalid"]),
      ],
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
      is_full_day: validation.value.isFullDay,
      creator_token_hash: draft.creatorTokenHash,
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
    const eventState = await repository.getEventLockState(input.eventId);

    if (!eventState) {
      return {
        ok: false,
        errors: ["event_id_invalid"],
      };
    }

    if (eventState.finalized_at) {
      return {
        ok: false,
        errors: ["event_finalized"],
      };
    }

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
    readonly eventId: string;
    readonly participantId: string;
    readonly windows: readonly {
      readonly start: string;
      readonly end: string;
    }[];
  },
  repository: AvailabilityRepository = createSupabaseAvailabilityRepository(),
): Promise<SaveAvailabilityResult> {
  const errors: string[] = [];

  if (!isUuid(input.eventId)) {
    errors.push("event_id_invalid");
  }

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
    const eventState = await repository.getEventLockState(input.eventId);

    if (!eventState) {
      return {
        ok: false,
        errors: ["event_id_invalid"],
      };
    }

    if (eventState.finalized_at) {
      return {
        ok: false,
        errors: ["event_finalized"],
      };
    }

    const result = await repository.replaceAvailability(
      input.eventId,
      input.participantId,
      windows,
    );

    if (result === "participant_not_found") {
      return {
        ok: false,
        errors: ["participant_id_invalid"],
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      errors: ["save_availability_failed"],
    };
  }
}

export async function finalizeEvent(
  input: {
    readonly eventId: string;
    readonly creatorTokenHash: string;
    readonly finalStart: string;
    readonly finalEnd: string;
  },
  repository: EventFinalizationRepository = createSupabaseEventFinalizationRepository(),
): Promise<FinalizeEventResult> {
  const errors = validateFinalizationInput(input);

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
    };
  }

  try {
    const event = await repository.getEventFinalizationState(input.eventId);

    if (!event) {
      return {
        ok: false,
        errors: ["event_id_invalid"],
      };
    }

    if (
      !event.creator_token_hash ||
      event.creator_token_hash !== input.creatorTokenHash
    ) {
      return {
        ok: false,
        errors: ["creator_token_invalid"],
      };
    }

    if (event.finalized_at) {
      return {
        ok: false,
        errors: ["event_finalized"],
      };
    }

    const snapshot = parseEventSnapshot(
      await repository.getEventSnapshot(input.eventId),
    );

    if (
      !isRankedFinalizationWindow(snapshot, input.finalStart, input.finalEnd)
    ) {
      return {
        ok: false,
        errors: ["final_window_invalid"],
      };
    }

    await repository.finalizeEvent(
      input.eventId,
      input.finalStart,
      input.finalEnd,
    );

    return { ok: true };
  } catch {
    return {
      ok: false,
      errors: ["finalize_event_failed"],
    };
  }
}

export async function cancelEventFinalization(
  input: {
    readonly eventId: string;
    readonly creatorTokenHash: string;
  },
  repository: EventFinalizationRepository = createSupabaseEventFinalizationRepository(),
): Promise<FinalizeEventResult> {
  if (!isUuid(input.eventId) || input.creatorTokenHash.length !== 64) {
    return {
      ok: false,
      errors: ["creator_token_invalid"],
    };
  }

  try {
    const event = await repository.getEventFinalizationState(input.eventId);

    if (!event) {
      return {
        ok: false,
        errors: ["event_id_invalid"],
      };
    }

    if (
      !event.creator_token_hash ||
      event.creator_token_hash !== input.creatorTokenHash
    ) {
      return {
        ok: false,
        errors: ["creator_token_invalid"],
      };
    }

    await repository.cancelFinalization(input.eventId);

    return { ok: true };
  } catch {
    return {
      ok: false,
      errors: ["cancel_finalization_failed"],
    };
  }
}

export async function cleanupStaleEvents(
  input: { readonly retentionDays?: number } = {},
  repository: StaleEventCleanupRepository = createSupabaseStaleEventCleanupRepository(),
): Promise<CleanupStaleEventsResult> {
  const retentionDays = input.retentionDays ?? 14;

  if (
    !Number.isInteger(retentionDays) ||
    retentionDays < 1 ||
    retentionDays > 365
  ) {
    return {
      ok: false,
      errors: ["retention_days_invalid"],
    };
  }

  try {
    const deletedCount = await repository.deleteStaleEvents(retentionDays);

    return {
      ok: true,
      deletedCount,
    };
  } catch {
    return {
      ok: false,
      errors: ["cleanup_stale_events_failed"],
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
    async getEventLockState(eventId) {
      const supabase = createServiceSupabaseClient();
      const { data, error } = await supabase
        .from("events")
        .select("finalized_at")
        .eq("id", eventId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
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
    async getEventLockState(eventId) {
      const supabase = createServiceSupabaseClient();
      const { data, error } = await supabase
        .from("events")
        .select("finalized_at")
        .eq("id", eventId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    async replaceAvailability(eventId, participantId, windows) {
      const supabase = createServiceSupabaseClient();
      const { data: participant, error: participantError } = await supabase
        .from("participants")
        .select("id")
        .eq("id", participantId)
        .eq("event_id", eventId)
        .maybeSingle();

      if (participantError) {
        throw participantError;
      }

      if (!participant) {
        return "participant_not_found";
      }

      const deleteResult = await supabase
        .from("availability_windows")
        .delete()
        .eq("participant_id", participantId);

      if (deleteResult.error) {
        throw deleteResult.error;
      }

      if (windows.length === 0) {
        return "replaced";
      }

      const insertResult = await supabase
        .from("availability_windows")
        .insert([...windows]);

      if (insertResult.error) {
        throw insertResult.error;
      }

      return "replaced";
    },
  };
}

function createSupabaseEventFinalizationRepository(): EventFinalizationRepository {
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
    async getEventFinalizationState(eventId) {
      const supabase = createServiceSupabaseClient();
      const { data, error } = await supabase
        .from("events")
        .select("id, is_full_day, creator_token_hash, finalized_at")
        .eq("id", eventId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    async finalizeEvent(eventId, finalStart, finalEnd) {
      const supabase = createServiceSupabaseClient();
      const { error } = await supabase
        .from("events")
        .update({
          finalized_start_at: finalStart,
          finalized_end_at: finalEnd,
          finalized_at: new Date().toISOString(),
        })
        .eq("id", eventId);

      if (error) {
        throw error;
      }
    },
    async cancelFinalization(eventId) {
      const supabase = createServiceSupabaseClient();
      const { error } = await supabase
        .from("events")
        .update({
          finalized_start_at: null,
          finalized_end_at: null,
          finalized_at: null,
        })
        .eq("id", eventId);

      if (error) {
        throw error;
      }
    },
  };
}

function isRankedFinalizationWindow(
  snapshot: EventSnapshot,
  finalStart: string,
  finalEnd: string,
): boolean {
  const rankInput = {
    participants: snapshot.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      timezone: participant.timezone,
    })),
    availability: snapshot.availabilityWindows.map((window) => ({
      participantId: window.participantId,
      start: window.start,
      end: window.end,
    })),
  };
  const rankedSlots = snapshot.event.isFullDay
    ? rankFullDayAvailabilitySlots({
        ...rankInput,
        startDate: snapshot.event.startDate,
        endDate: snapshot.event.endDate,
      })
    : rankAvailabilitySlots({
        ...rankInput,
        durationMinutes: snapshot.event.durationMinutes,
        slotSizeMinutes: snapshot.event.slotSizeMinutes,
      });

  return rankedSlots.some(
    (slot) => slot.start === finalStart && slot.end === finalEnd,
  );
}

function createSupabaseStaleEventCleanupRepository(): StaleEventCleanupRepository {
  return {
    async deleteStaleEvents(retentionDays) {
      const supabase = createServiceSupabaseClient();
      const { data, error } = await supabase.rpc("delete_stale_events", {
        retention_days: retentionDays,
      });

      if (error) {
        throw error;
      }

      return typeof data === "number" ? data : 0;
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
      isFullDay: asBoolean(event.is_full_day ?? false),
      creatorTokenHash: asNullableString(event.creator_token_hash),
      finalizedStart: asNullableString(event.finalized_start_at),
      finalizedEnd: asNullableString(event.finalized_end_at),
      finalizedAt: asNullableString(event.finalized_at),
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

function validateFinalizationInput(input: {
  readonly eventId: string;
  readonly creatorTokenHash: string;
  readonly finalStart: string;
  readonly finalEnd: string;
}): string[] {
  const errors: string[] = [];
  const startMs = Date.parse(input.finalStart);
  const endMs = Date.parse(input.finalEnd);

  if (!isUuid(input.eventId)) {
    errors.push("event_id_invalid");
  }

  if (input.creatorTokenHash.length !== 64) {
    errors.push("creator_token_invalid");
  }

  if (Number.isNaN(startMs) || Number.isNaN(endMs) || startMs >= endMs) {
    errors.push("final_window_invalid");
  }

  return errors;
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
    (message.includes("start_time") ||
      message.includes("end_time") ||
      message.includes("is_full_day") ||
      message.includes("creator_token_hash") ||
      message.includes("finalized_start_at") ||
      message.includes("finalized_end_at") ||
      message.includes("finalized_at"))
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

function asNullableString(value: Json | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return asString(value);
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

function asBoolean(value: Json | undefined): boolean {
  if (typeof value !== "boolean") {
    throw new Error("Expected boolean");
  }

  return value;
}
