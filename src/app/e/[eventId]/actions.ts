"use server";

import { revalidatePath } from "next/cache";
import { joinEvent } from "@/server/events";

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

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
