import { validateEventDraft, type EventDraft } from "../domain/availability";
import { createServiceSupabaseClient } from "./supabase";

export interface EventInsert {
  readonly title: string;
  readonly start_date: string;
  readonly end_date: string;
  readonly duration_minutes: number;
  readonly slot_size_minutes: number;
}

export interface EventRepository {
  readonly insertEvent: (event: EventInsert) => Promise<{ readonly id: string }>;
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

export async function createEvent(
  draft: EventDraft,
  repository: EventRepository = createSupabaseEventRepository(),
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

function createSupabaseEventRepository(): EventRepository {
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
