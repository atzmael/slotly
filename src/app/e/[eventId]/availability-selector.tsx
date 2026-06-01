"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { saveAvailabilityAction } from "./actions";
import { broadcastEventChange } from "./event-realtime";

interface AvailabilitySelectorProps {
  readonly eventId: string;
  readonly participantId: string;
  readonly startDate: string;
  readonly endDate: string;
}

interface AvailabilityCell {
  readonly id: string;
  readonly label: string;
  readonly dayLabel: string;
  readonly start: string;
  readonly end: string;
}

const hours = [18, 19, 20, 21];

const initialSaveAvailabilityState = {
  status: "idle" as const,
  errors: [] as readonly string[],
};

const errorCopy: Record<string, string> = {
  participant_id_invalid: "Join the poll again before saving availability.",
  availability_required: "Select at least one slot.",
  availability_too_large: "Too many slots selected.",
  availability_window_invalid: "One selected slot is invalid.",
  save_availability_failed: "Could not save availability. Try again.",
};

export function AvailabilitySelector({
  eventId,
  participantId,
  startDate,
  endDate,
}: AvailabilitySelectorProps) {
  const cells = useMemo(
    () => buildAvailabilityCells(startDate, endDate),
    [startDate, endDate],
  );
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [state, formAction, isPending] = useActionState(
    saveAvailabilityAction,
    initialSaveAvailabilityState,
  );
  const selectedWindows = cells
    .filter((cell) => selectedIds.has(cell.id))
    .map((cell) => ({ start: cell.start, end: cell.end }));

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    void broadcastEventChange(eventId, "availability_saved");
  }, [eventId, state]);

  function toggleCell(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-4">
      <input name="eventId" type="hidden" value={eventId} />
      <input name="participantId" type="hidden" value={participantId} />
      <input name="windows" type="hidden" value={JSON.stringify(selectedWindows)} />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Pick availability</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Tap every slot that works for you.
          </p>
        </div>
        <span className="text-sm font-medium text-[var(--primary)]">
          {selectedIds.size} selected
        </span>
      </div>

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
          Availability saved.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {cells.map((cell) => {
          const selected = selectedIds.has(cell.id);

          return (
            <button
              aria-pressed={selected}
              className={`min-h-20 rounded-[6px] border px-2 py-2 text-left text-xs hover:border-[var(--primary)] active:scale-[0.99] ${
                selected
                  ? "border-[var(--primary)] bg-[#dff4ed] text-[var(--foreground)]"
                  : "border-[var(--line)] bg-[#f2f2ec] text-[var(--muted)]"
              }`}
              key={cell.id}
              onClick={() => toggleCell(cell.id)}
              type="button"
            >
              <span className="block font-semibold">{cell.dayLabel}</span>
              <span className="mt-2 block">{cell.label}</span>
            </button>
          );
        })}
      </div>

      <button
        className="sl-button sl-button-primary w-full px-5 py-3"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Saving..." : "Save availability"}
      </button>
    </form>
  );
}

function buildAvailabilityCells(
  startDate: string,
  endDate: string,
): AvailabilityCell[] {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  const cells: AvailabilityCell[] = [];

  for (
    const day = new Date(start);
    day.getTime() <= end.getTime();
    day.setDate(day.getDate() + 1)
  ) {
    for (const hour of hours) {
      const startAt = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        hour,
      );
      const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);

      cells.push({
        id: `${toDateInputValue(day)}-${hour}`,
        dayLabel: new Intl.DateTimeFormat("en", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }).format(day),
        label: `${formatHour(startAt)} -> ${formatHour(endAt)}`,
        start: startAt.toISOString(),
        end: endAt.toISOString(),
      });
    }
  }

  return cells;
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateInputValue(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatHour(value: Date): string {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}
