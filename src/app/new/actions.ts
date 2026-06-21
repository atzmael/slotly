"use server";

import { redirect } from "next/navigation";
import { createEvent } from "@/server/events";

interface CreateEventActionState {
  readonly status: "idle" | "error";
  readonly errors: readonly string[];
}

export async function createEventAction(
  _previousState: CreateEventActionState,
  formData: FormData,
): Promise<CreateEventActionState> {
  const result = await createEvent({
    title: getString(formData, "title"),
    startDate: getString(formData, "startDate"),
    endDate: getString(formData, "endDate"),
    startTime: getString(formData, "startTime"),
    endTime: getString(formData, "endTime"),
    durationMinutes: getNumber(formData, "durationMinutes"),
    slotSizeMinutes: getNumber(formData, "slotSizeMinutes"),
  });

  if (!result.ok) {
    return {
      status: "error",
      errors: result.errors,
    };
  }

  redirect(`/e/${result.eventId}`);
}

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getNumber(formData: FormData, key: string): number {
  const value = formData.get(key);
  return typeof value === "string" ? Number(value) : Number.NaN;
}
