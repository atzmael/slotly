"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { joinEventAction } from "./actions";
import { AvailabilitySelector } from "./availability-selector";
import { broadcastEventChange } from "./event-realtime";

const errorCopy: Record<string, string> = {
  event_id_invalid: "This event link is invalid.",
  name_required: "Add your name.",
  name_too_long: "Keep your name under 60 characters.",
  timezone_invalid: "Your timezone could not be detected.",
  join_event_failed: "Could not join this poll. Try again.",
};

const initialJoinEventState = {
  status: "idle" as const,
  errors: [] as readonly string[],
};

export function JoinEventForm({
  eventId,
  startDate,
  endDate,
}: {
  readonly eventId: string;
  readonly startDate: string;
  readonly endDate: string;
}) {
  const [timezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );
  const [state, formAction, isPending] = useActionState(
    joinEventAction,
    initialJoinEventState,
  );
  const lastBroadcastParticipantId = useRef<string | null>(null);

  useEffect(() => {
    if (
      state.status !== "success" ||
      !state.participantId ||
      lastBroadcastParticipantId.current === state.participantId
    ) {
      return;
    }

    lastBroadcastParticipantId.current = state.participantId;
    void broadcastEventChange(eventId, "participant_joined");
  }, [eventId, state]);

  return (
    <div className="space-y-4">
      {state.status === "error" ? (
        <div className="sl-alert sl-alert-error" role="alert">
          <ul className="space-y-1">
            {state.errors.map((error) => (
              <li key={error}>{errorCopy[error] ?? "Something went wrong."}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {state.status === "success" ? (
        <div className="sl-alert sl-alert-success" role="status">
          You joined this poll. Pick your availability next.
        </div>
      ) : null}

      {state.status === "success" && state.participantId ? (
        <AvailabilitySelector
          endDate={endDate}
          eventId={eventId}
          participantId={state.participantId}
          startDate={startDate}
        />
      ) : null}

      {state.status !== "success" ? (
        <form action={formAction} className="space-y-4">
          <input name="eventId" type="hidden" value={eventId} />
          <input name="timezone" type="hidden" value={timezone} />

          <label className="block">
            <span className="text-sm font-medium">Your name</span>
            <input
              className="sl-field mt-2"
              maxLength={60}
              name="name"
              placeholder="Mael"
              required
              type="text"
            />
          </label>

          <p className="text-sm leading-6 text-[var(--muted)]">
            Times are shown in {timezone}. Availability selection comes next.
          </p>

          <button
            className="sl-button sl-button-primary w-full px-5 py-3"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Joining..." : "Join poll"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
