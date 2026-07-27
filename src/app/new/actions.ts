"use server";

import { redirect } from "next/navigation";
import { createEvent } from "@/server/events";
import { checkActionRateLimit } from "@/server/rate-limit";

interface CreateEventActionState {
  readonly status: "idle" | "error";
  readonly errors: readonly string[];
  readonly values: CreateEventActionValues;
}

interface CreateEventActionValues {
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly durationMinutes: number;
  readonly slotSizeMinutes: number;
}

export async function createEventAction(
  _previousState: CreateEventActionState,
  formData: FormData,
): Promise<CreateEventActionState> {
  const values = getCreateEventActionValues(formData);

  if (!(await checkActionRateLimit("create_event"))) {
    return {
      status: "error",
      errors: ["rate_limited"],
      values,
    };
  }

  const result = await createEvent(values);

  if (!result.ok) {
    return {
      status: "error",
      errors: result.errors,
      values,
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

function getCreateEventActionValues(
  formData: FormData,
): CreateEventActionValues {
  return {
    title: getString(formData, "title"),
    startDate: getString(formData, "startDate"),
    endDate: getString(formData, "endDate"),
    startTime: getString(formData, "startTime"),
    endTime: getString(formData, "endTime"),
    durationMinutes: getNumber(formData, "durationMinutes"),
    slotSizeMinutes: getNumber(formData, "slotSizeMinutes"),
  };
}
