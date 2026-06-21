"use client";

import {
  Fragment,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { KeyboardEvent } from "react";
import type { EventAvailabilityWindow } from "@/server/events";
import { saveAvailabilityAction } from "./actions";
import { broadcastEventChange } from "./event-realtime";

interface AvailabilitySelectorProps {
  readonly eventId: string;
  readonly initialWindows?: readonly EventAvailabilityWindow[];
  readonly participantId: string;
  readonly startDate: string;
  readonly startTime: string;
  readonly endDate: string;
  readonly endTime: string;
  readonly slotSizeMinutes: number;
}

interface AvailabilityCell {
  readonly id: string;
  readonly label: string;
  readonly dayLabel: string;
  readonly start: string;
  readonly end: string;
}

interface AvailabilityDay {
  readonly id: string;
  readonly label: string;
  readonly cells: readonly AvailabilityCell[];
}

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
  initialWindows = [],
  participantId,
  startDate,
  startTime,
  endDate,
  endTime,
  slotSizeMinutes,
}: AvailabilitySelectorProps) {
  const days = useMemo(
    () =>
      buildAvailabilityDays(
        startDate,
        endDate,
        startTime,
        endTime,
        slotSizeMinutes,
      ),
    [endDate, endTime, slotSizeMinutes, startDate, startTime],
  );
  const cells = useMemo(() => days.flatMap((day) => day.cells), [days]);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() =>
    buildSelectedIds(cells, initialWindows),
  );
  const [dragAction, setDragAction] = useState<"add" | "remove" | null>(null);
  const [visibleStartIndex, setVisibleStartIndex] = useState(0);
  const visibleDayCount = useVisibleDayCount();
  const maxVisibleStartIndex = Math.max(0, days.length - visibleDayCount);
  const safeVisibleStartIndex = Math.min(
    visibleStartIndex,
    maxVisibleStartIndex,
  );
  const visibleDays = days.slice(
    safeVisibleStartIndex,
    safeVisibleStartIndex + visibleDayCount,
  );
  const visibleRows = visibleDays[0]?.cells ?? [];
  const canPageDays = days.length > visibleDayCount;
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

  const applyCell = useCallback((id: string, action: "add" | "remove") => {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (action === "add") {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
  }, []);

  useEffect(() => {
    if (!dragAction) {
      return;
    }

    const action = dragAction;

    function handlePointerMove(event: PointerEvent) {
      const target = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>("[data-availability-cell-id]");

      if (!target?.dataset.availabilityCellId) {
        return;
      }

      applyCell(target.dataset.availabilityCellId, action);
    }

    function stopDragging() {
      setDragAction(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging, { once: true });
    window.addEventListener("pointercancel", stopDragging, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [applyCell, dragAction]);

  function startCellDrag(id: string) {
    const action = selectedIds.has(id) ? "remove" : "add";
    setDragAction(action);
    applyCell(id, action);
  }

  function handleCellKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    id: string,
    selected: boolean,
  ) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    applyCell(id, selected ? "remove" : "add");
  }

  return (
    <form action={formAction} className="space-y-4">
      <input name="eventId" type="hidden" value={eventId} />
      <input name="participantId" type="hidden" value={participantId} />
      <input
        name="windows"
        type="hidden"
        value={JSON.stringify(selectedWindows)}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Pick availability</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Tap or drag across every slot that works for you.
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

      {canPageDays ? (
        <div className="flex items-center justify-between gap-3">
          <button
            className="sl-button sl-button-secondary"
            disabled={safeVisibleStartIndex === 0}
            onClick={() =>
              setVisibleStartIndex((current) =>
                Math.max(0, current - visibleDayCount),
              )
            }
            type="button"
          >
            Previous
          </button>
          <span className="text-sm text-[var(--muted)]">
            {safeVisibleStartIndex + 1}-
            {Math.min(days.length, safeVisibleStartIndex + visibleDayCount)} of{" "}
            {days.length}
          </span>
          <button
            className="sl-button sl-button-secondary"
            disabled={safeVisibleStartIndex >= maxVisibleStartIndex}
            onClick={() =>
              setVisibleStartIndex((current) =>
                Math.min(maxVisibleStartIndex, current + visibleDayCount),
              )
            }
            type="button"
          >
            Next
          </button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--surface)]">
        <div
          className="grid select-none"
          style={{
            gridTemplateColumns: `4.5rem repeat(${visibleDays.length}, minmax(5.5rem, 1fr))`,
          }}
        >
          <div className="border-b border-[var(--line)] bg-[#f5f5ef] px-2 py-3 text-xs font-medium text-[var(--muted)]">
            Time
          </div>
          {visibleDays.map((day) => (
            <div
              className="border-b border-l border-[var(--line)] bg-[#f5f5ef] px-2 py-3 text-center text-xs font-semibold"
              key={day.id}
            >
              {day.label}
            </div>
          ))}

          {visibleRows.map((row, rowIndex) => (
            <Fragment key={row.label}>
              <div className="border-b border-[var(--line)] px-2 py-3 text-xs font-medium text-[var(--muted)]">
                {row.label.split(" -> ")[0]}
              </div>
              {visibleDays.map((day) => {
                const cell = day.cells[rowIndex];
                const selected = selectedIds.has(cell.id);

                return (
                  <button
                    aria-label={`${cell.dayLabel} ${cell.label}`}
                    aria-pressed={selected}
                    className={`min-h-14 touch-none border-b border-l border-[var(--line)] px-2 py-3 text-left text-xs hover:border-[var(--primary)] active:scale-[0.99] ${
                      selected
                        ? "bg-[#dff4ed] text-[var(--foreground)]"
                        : "bg-[var(--surface)] text-[var(--muted)]"
                    }`}
                    data-availability-cell-id={cell.id}
                    key={cell.id}
                    onKeyDown={(event) =>
                      handleCellKeyDown(event, cell.id, selected)
                    }
                    onPointerDown={(event) => {
                      event.preventDefault();
                      startCellDrag(cell.id);
                    }}
                    type="button"
                  >
                    <span className="sr-only">{cell.label}</span>
                  </button>
                );
              })}
            </Fragment>
          ))}
        </div>
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

function buildAvailabilityDays(
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string,
  slotSizeMinutes: number,
): AvailabilityDay[] {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  const days: AvailabilityDay[] = [];

  for (
    const day = new Date(start);
    day.getTime() <= end.getTime();
    day.setDate(day.getDate() + 1)
  ) {
    const dayId = toDateInputValue(day);
    const dayLabel = new Intl.DateTimeFormat("en", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(day);

    days.push({
      id: dayId,
      label: dayLabel,
      cells: range(startMinutes, endMinutes, slotSizeMinutes).map((minutes) => {
        const startAt = new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          Math.floor(minutes / 60),
          minutes % 60,
        );
        const endAt = new Date(startAt.getTime() + slotSizeMinutes * 60 * 1000);

        return {
          id: `${dayId}-${minutes}`,
          dayLabel,
          label: `${formatHour(startAt)} -> ${formatHour(endAt)}`,
          start: startAt.toISOString(),
          end: endAt.toISOString(),
        };
      }),
    });
  }

  return days;
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

function parseTimeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function range(start: number, end: number, step: number): number[] {
  const values: number[] = [];

  for (let value = start; value + step <= end; value += step) {
    values.push(value);
  }

  return values;
}

function buildSelectedIds(
  cells: readonly AvailabilityCell[],
  windows: readonly EventAvailabilityWindow[],
): ReadonlySet<string> {
  const windowKeys = new Set(
    windows.map((window) => getWindowKey(window.start, window.end)),
  );

  return new Set(
    cells
      .filter((cell) => windowKeys.has(getWindowKey(cell.start, cell.end)))
      .map((cell) => cell.id),
  );
}

function getWindowKey(start: string, end: string): string {
  return `${Date.parse(start)}:${Date.parse(end)}`;
}

function useVisibleDayCount(): number {
  return useSyncExternalStore(
    subscribeToViewportChanges,
    getVisibleDayCount,
    () => 7,
  );
}

function subscribeToViewportChanges(onStoreChange: () => void) {
  window.addEventListener("resize", onStoreChange);
  return () => window.removeEventListener("resize", onStoreChange);
}

function getVisibleDayCount(): number {
  if (window.innerWidth < 640) {
    return 1;
  }

  if (window.innerWidth < 1024) {
    return 2;
  }

  return 7;
}
