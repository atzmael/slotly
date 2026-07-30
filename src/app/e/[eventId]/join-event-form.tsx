"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { trackEvent } from "@/analytics/client";
import { getDeviceType, resolveRoutePattern } from "@/analytics/events";
import type {
  EventAvailabilityWindow,
  EventParticipant,
} from "@/server/events";
import { messages, type Locale } from "@/i18n/messages";
import { joinEventAction } from "./actions";
import { AvailabilitySelector } from "./availability-selector";
import { broadcastEventChange } from "./event-realtime";
import { FullDayAvailabilitySelector } from "./full-day-availability-selector";
import { TemporaryStatusMessage } from "./temporary-status-message";

const initialJoinEventState = {
  status: "idle" as const,
  errors: [] as readonly string[],
};

export function JoinEventForm({
  availabilityWindows,
  eventId,
  isFullDay,
  participants,
  startDate,
  startTime,
  endDate,
  endTime,
  locale,
  slotSizeMinutes,
}: {
  readonly availabilityWindows: readonly EventAvailabilityWindow[];
  readonly eventId: string;
  readonly isFullDay: boolean;
  readonly participants: readonly EventParticipant[];
  readonly startDate: string;
  readonly startTime: string;
  readonly endDate: string;
  readonly endTime: string;
  readonly locale: Locale;
  readonly slotSizeMinutes: number;
}) {
  const [timezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );
  const [state, formAction, isPending] = useActionState(
    joinEventAction,
    initialJoinEventState,
  );
  const lastBroadcastParticipantId = useRef<string | null>(null);
  const lastTrackedParticipantId = useRef<string | null>(null);
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
  const t = messages[locale];

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

  useEffect(() => {
    if (
      state.status !== "success" ||
      !state.participantId ||
      lastTrackedParticipantId.current === state.participantId
    ) {
      return;
    }

    lastTrackedParticipantId.current = state.participantId;
    trackEvent({
      name: "participant.joined",
      properties: {
        device_type: getDeviceType(window.innerWidth),
        locale,
        participants_count: participants.length,
        route_pattern: resolveRoutePattern(window.location.pathname),
      },
    });
  }, [locale, participants.length, state]);

  function trackJoinSubmitted() {
    trackEvent({
      name: "join.submitted",
      properties: {
        device_type: getDeviceType(window.innerWidth),
        locale,
        participants_count: participants.length,
        route_pattern: resolveRoutePattern(window.location.pathname),
      },
    });
  }

  return (
    <div className="space-y-4">
      {state.status === "error" ? (
        <div className="sl-alert sl-alert-error" role="alert">
          <ul className="space-y-1">
            {state.errors.map((error) => (
              <li key={error}>
                {t.event.join.errors[
                  error as keyof typeof t.event.join.errors
                ] ?? t.common.fallbackError}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {state.status === "success" ? (
        <TemporaryStatusMessage key={state.statusId}>
          {t.event.join.joined}
        </TemporaryStatusMessage>
      ) : null}

      {state.status !== "success" && activeParticipant ? (
        <TemporaryStatusMessage key={`welcome-${activeParticipant.id}`}>
          {t.event.join.welcomeBack(activeParticipant.name)}
        </TemporaryStatusMessage>
      ) : null}

      {activeParticipantId && isFullDay ? (
        <FullDayAvailabilitySelector
          endDate={endDate}
          eventId={eventId}
          initialWindows={activeAvailabilityWindows}
          key={activeParticipantId}
          locale={locale}
          participantId={activeParticipantId}
          startDate={startDate}
        />
      ) : null}

      {activeParticipantId && !isFullDay ? (
        <AvailabilitySelector
          endDate={endDate}
          endTime={endTime}
          eventId={eventId}
          initialWindows={activeAvailabilityWindows}
          key={activeParticipantId}
          locale={locale}
          participantId={activeParticipantId}
          slotSizeMinutes={slotSizeMinutes}
          startDate={startDate}
          startTime={startTime}
        />
      ) : null}

      {!activeParticipantId ? (
        <form
          action={formAction}
          className="space-y-4"
          onSubmit={trackJoinSubmitted}
        >
          <input name="eventId" type="hidden" value={eventId} />
          <input name="timezone" type="hidden" value={timezone} />

          <label className="block">
            <span className="text-sm font-medium">
              {t.event.join.nameLabel}
            </span>
            <input
              className="sl-field mt-2"
              maxLength={60}
              name="name"
              placeholder={t.event.join.namePlaceholder}
              required
              type="text"
            />
          </label>

          <p className="text-sm leading-6 text-[var(--muted)]">
            {t.event.join.timezoneNotice(timezone)}
          </p>

          <button
            className="sl-button sl-button-primary w-full px-5 py-3"
            disabled={isPending}
            type="submit"
          >
            {isPending ? t.event.join.joining : t.event.join.submit}
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
