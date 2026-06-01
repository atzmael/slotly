"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { EventAvailabilityWindow, EventParticipant } from "@/server/events";
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
  availabilityWindows,
  eventId,
  participants,
  startDate,
  endDate,
}: {
  readonly availabilityWindows: readonly EventAvailabilityWindow[];
  readonly eventId: string;
  readonly participants: readonly EventParticipant[];
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
  const restoredParticipantId = useStoredParticipantId(eventId, participants);
  const activeParticipantId =
    state.status === "success" && state.participantId
      ? state.participantId
      : restoredParticipantId;
  const activeParticipant = participants.find(
    (participant) => participant.id === activeParticipantId,
  );
  const activeAvailabilityWindows = availabilityWindows.filter(
    (window) => window.participantId === activeParticipantId,
  );

  useEffect(() => {
    if (
      state.status !== "success" ||
      !state.participantId ||
      lastBroadcastParticipantId.current === state.participantId
    ) {
      return;
    }

    lastBroadcastParticipantId.current = state.participantId;
    window.localStorage.setItem(
      getParticipantStorageKey(eventId),
      state.participantId,
    );
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

      {state.status !== "success" && activeParticipant ? (
        <div className="sl-alert sl-alert-success" role="status">
          Welcome back, {activeParticipant.name}. Update your availability below.
        </div>
      ) : null}

      {activeParticipantId ? (
        <AvailabilitySelector
          endDate={endDate}
          eventId={eventId}
          initialWindows={activeAvailabilityWindows}
          key={activeParticipantId}
          participantId={activeParticipantId}
          startDate={startDate}
        />
      ) : null}

      {!activeParticipantId ? (
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

function getParticipantStorageKey(eventId: string): string {
  return `slotly:event:${eventId}:participantId`;
}

function useStoredParticipantId(
  eventId: string,
  participants: readonly EventParticipant[],
): string | null {
  const participantIds = useMemo(
    () => new Set(participants.map((participant) => participant.id)),
    [participants],
  );

  return useSyncExternalStore(
    subscribeToStoredParticipantChanges,
    () => getStoredParticipantId(eventId, participantIds),
    () => null,
  );
}

function subscribeToStoredParticipantChanges(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getStoredParticipantId(
  eventId: string,
  participantIds: ReadonlySet<string>,
): string | null {
  const storedParticipantId = window.localStorage.getItem(
    getParticipantStorageKey(eventId),
  );

  if (!storedParticipantId || !participantIds.has(storedParticipantId)) {
    return null;
  }

  return storedParticipantId;
}
