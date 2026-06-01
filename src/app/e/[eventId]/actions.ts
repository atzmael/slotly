"use server";

import { revalidatePath } from "next/cache";
import { joinEvent, saveAvailability } from "@/server/events";

interface JoinEventActionState {
  readonly status: "idle" | "error" | "success";
  readonly errors: readonly string[];
  readonly participantId?: string;
}

export async function joinEventAction(
  _previousState: JoinEventActionState,
  formData: FormData,
): Promise<JoinEventActionState> {
  const eventId = getString(formData, "eventId");
  const result = await joinEvent({
    eventId,
    name: getString(formData, "name"),
    timezone: getString(formData, "timezone"),
  });

  if (!result.ok) {
    return {
      status: "error",
      errors: result.errors,
    };
  }

  revalidatePath(`/e/${eventId}`);

  return {
    status: "success",
    errors: [],
    participantId: result.participantId,
  };
}

interface SaveAvailabilityActionState {
  readonly status: "idle" | "error" | "success";
  readonly errors: readonly string[];
}

export async function saveAvailabilityAction(
  _previousState: SaveAvailabilityActionState,
  formData: FormData,
): Promise<SaveAvailabilityActionState> {
  const eventId = getString(formData, "eventId");
  const result = await saveAvailability({
    participantId: getString(formData, "participantId"),
    windows: parseWindows(getString(formData, "windows")),
  });

  if (!result.ok) {
    return {
      status: "error",
      errors: result.errors,
    };
  }

  revalidatePath(`/e/${eventId}`);
  revalidatePath(`/e/${eventId}/results`);

  return {
    status: "success",
    errors: [],
  };
}

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseWindows(
  value: string,
): Array<{ readonly start: string; readonly end: string }> {
  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((item) => {
      if (
        typeof item === "object" &&
        item !== null &&
        "start" in item &&
        "end" in item &&
        typeof item.start === "string" &&
        typeof item.end === "string"
      ) {
        return [{ start: item.start, end: item.end }];
      }

      return [];
    });
  } catch {
    return [];
  }
}
