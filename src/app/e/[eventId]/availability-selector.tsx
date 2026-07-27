"use client";

import {
  Fragment,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent } from "react";
import type { EventAvailabilityWindow } from "@/server/events";
import { saveAvailabilityAction } from "./actions";
import { broadcastEventChange } from "./event-realtime";
import { TemporaryStatusMessage } from "./temporary-status-message";

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
  readonly dayIndex: number;
  readonly rowIndex: number;
  readonly startMinutes: number;
  readonly endMinutes: number;
  readonly start: string;
  readonly end: string;
}

interface AvailabilityDay {
  readonly id: string;
  readonly label: string;
  readonly isWeekday: boolean;
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
  rate_limited: "Too many attempts. Wait a few minutes, then try again.",
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
  const initialSelectedIds = useMemo(
    () => buildSelectedIds(cells, initialWindows),
    [cells, initialWindows],
  );
  const cellById = useMemo(
    () => new Map(cells.map((cell) => [cell.id, cell])),
    [cells],
  );
  const [savedSelectedIds, setSavedSelectedIds] =
    useState<ReadonlySet<string>>(initialSelectedIds);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => initialSelectedIds,
  );
  const dragSelection = useRef<{
    readonly originId: string;
    readonly action: "add" | "remove";
  } | null>(null);
  const [bulkStartTime, setBulkStartTime] = useState(startTime);
  const [bulkEndTime, setBulkEndTime] = useState(endTime);
  const rows = days[0]?.cells ?? [];
  const [state, formAction, isPending] = useActionState(
    saveAvailabilityAction,
    initialSaveAvailabilityState,
  );
  const handledSuccessState = useRef<typeof state | null>(null);
  const isDirty = !areSetsEqual(selectedIds, savedSelectedIds);
  const bulkStartMinutes = parseTimeToMinutes(bulkStartTime);
  const bulkEndMinutes = parseTimeToMinutes(bulkEndTime);
  const canApplyBulkRange = bulkStartMinutes < bulkEndMinutes;
  const selectedWindows = cells
    .filter((cell) => selectedIds.has(cell.id))
    .map((cell) => ({ start: cell.start, end: cell.end }));

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSavedSelectedIds(initialSelectedIds);
      setSelectedIds(initialSelectedIds);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [initialSelectedIds]);

  useEffect(() => {
    if (state.status !== "success" || handledSuccessState.current === state) {
      return;
    }

    handledSuccessState.current = state;
    const savedIds = selectedIds;
    const timeoutId = window.setTimeout(() => {
      setSavedSelectedIds(savedIds);
    }, 0);
    void broadcastEventChange(eventId, "availability_saved");

    return () => window.clearTimeout(timeoutId);
  }, [eventId, selectedIds, state]);

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

  const applyCells = useCallback(
    (ids: readonly string[], action: "add" | "remove") => {
      setSelectedIds((current) => {
        const next = new Set(current);

        for (const id of ids) {
          if (action === "add") {
            next.add(id);
          } else {
            next.delete(id);
          }
        }

        return next;
      });
    },
    [],
  );

  const getRectCellIds = useCallback(
    (originId: string, targetId: string) => {
      const origin = cellById.get(originId);
      const target = cellById.get(targetId);

      if (!origin || !target) {
        return [];
      }

      const minDayIndex = Math.min(origin.dayIndex, target.dayIndex);
      const maxDayIndex = Math.max(origin.dayIndex, target.dayIndex);
      const minRowIndex = Math.min(origin.rowIndex, target.rowIndex);
      const maxRowIndex = Math.max(origin.rowIndex, target.rowIndex);
      const ids: string[] = [];

      for (const day of days.slice(minDayIndex, maxDayIndex + 1)) {
        for (const cell of day.cells.slice(minRowIndex, maxRowIndex + 1)) {
          ids.push(cell.id);
        }
      }

      return ids;
    },
    [cellById, days],
  );

  function startCellDrag(id: string) {
    const action = selectedIds.has(id) ? "remove" : "add";
    dragSelection.current = { originId: id, action };
    applyCell(id, action);

    function handlePointerMove(event: PointerEvent) {
      const target = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>("[data-availability-cell-id]");
      const selection = dragSelection.current;

      if (!target?.dataset.availabilityCellId || !selection) {
        return;
      }

      applyCells(
        getRectCellIds(selection.originId, target.dataset.availabilityCellId),
        selection.action,
      );
    }

    function stopDragging() {
      dragSelection.current = null;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging, { once: true });
    window.addEventListener("pointercancel", stopDragging, { once: true });
  }

  function applyBulkRange(scope: "all" | "weekdays") {
    if (!canApplyBulkRange) {
      return;
    }

    setSelectedIds((current) => {
      const next = new Set(current);

      for (const day of days) {
        if (scope === "weekdays" && !day.isWeekday) {
          continue;
        }

        for (const cell of day.cells) {
          if (
            cell.startMinutes >= bulkStartMinutes &&
            cell.endMinutes <= bulkEndMinutes
          ) {
            next.add(cell.id);
          }
        }
      }

      return next;
    });
  }

  function clearAll() {
    setSelectedIds(new Set());
  }

  function cancelChanges() {
    setSelectedIds(savedSelectedIds);
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
    <form action={formAction} className="flex flex-col gap-3 sm:gap-4">
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
          {selectedIds.size} selected{isDirty ? " - unsaved" : ""}
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
        <TemporaryStatusMessage key={state.statusId}>
          Availability saved.
        </TemporaryStatusMessage>
      ) : null}

      <div className="mx-[-1rem] space-y-0 sm:mx-0 sm:space-y-2">
        <details
          className="sl-panel sl-accordion"
          data-testid="quick-actions-panel"
        >
          <summary className="flex min-h-10 items-center justify-between gap-2 px-2 py-2 text-sm font-medium">
            <span>Quick actions</span>
            <span
              aria-hidden="true"
              className="sl-accordion-icon text-xs text-[var(--muted)]"
            >
              +
            </span>
          </summary>
          <div className="space-y-2 border-t border-[var(--line)] p-2">
            <p className="text-xs leading-5 text-[var(--muted)]">
              Fill the same time range across several days at once.
            </p>
            <div className="grid grid-cols-2">
              <label className="block min-w-0 overflow-hidden pr-1">
                <span className="text-xs font-medium text-[var(--muted)]">
                  From
                </span>
                <input
                  className="sl-field sl-time-field mt-1 h-9 min-h-0 px-2 py-1 text-sm"
                  max={endTime}
                  min={startTime}
                  onChange={(event) => setBulkStartTime(event.target.value)}
                  step={slotSizeMinutes * 60}
                  type="time"
                  value={bulkStartTime}
                />
              </label>
              <label className="block min-w-0 overflow-hidden pl-1">
                <span className="text-xs font-medium text-[var(--muted)]">
                  To
                </span>
                <input
                  className="sl-field sl-time-field mt-1 h-9 min-h-0 px-2 py-1 text-sm"
                  max={endTime}
                  min={startTime}
                  onChange={(event) => setBulkEndTime(event.target.value)}
                  step={slotSizeMinutes * 60}
                  type="time"
                  value={bulkEndTime}
                />
              </label>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-1.5 sm:gap-2">
              <button
                className="sl-button sl-button-secondary min-h-8 min-w-0 px-1.5 py-1 text-[0.8125rem] leading-tight sm:min-h-9 sm:px-3 sm:py-1.5 sm:text-xs"
                disabled={!canApplyBulkRange}
                onClick={() => applyBulkRange("all")}
                type="button"
              >
                Apply to all days
              </button>
              <button
                className="sl-button sl-button-secondary min-h-8 min-w-0 px-1.5 py-1 text-[0.8125rem] leading-tight sm:min-h-9 sm:px-3 sm:py-1.5 sm:text-xs"
                disabled={!canApplyBulkRange}
                onClick={() => applyBulkRange("weekdays")}
                type="button"
              >
                Apply to weekdays
              </button>
            </div>
          </div>
        </details>

        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-1.5 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-2 sm:gap-2">
          <button
            className="sl-button sl-button-secondary min-h-8 min-w-0 px-1.5 py-1 text-[0.8125rem] leading-tight sm:px-3 sm:text-xs"
            disabled={selectedIds.size === 0}
            onClick={clearAll}
            type="button"
          >
            Clear all
          </button>
          <button
            className="sl-button sl-button-secondary min-h-8 min-w-0 px-1.5 py-1 text-[0.8125rem] leading-tight sm:px-3 sm:text-xs"
            disabled={!isDirty}
            onClick={cancelChanges}
            type="button"
          >
            Cancel changes
          </button>
        </div>

        <div className="mt-2 overflow-x-auto rounded-t-none rounded-b-[8px] border border-[var(--line)] bg-[var(--surface)] sm:mt-0 sm:rounded-t-[8px]">
          <div
            className="grid min-w-max select-none [--day-col-min:5.75rem] [--time-col-width:3.25rem] sm:[--day-col-min:7rem] sm:[--time-col-width:4.5rem]"
            style={{
              gridTemplateColumns: `var(--time-col-width) repeat(${days.length}, minmax(var(--day-col-min), 1fr))`,
            }}
          >
            <div className="sticky left-0 z-10 border-r border-b border-[var(--line)] bg-[#f5f5ef] px-1.5 py-2.5 text-xs font-medium text-[var(--muted)] sm:px-2 sm:py-3">
              Time
            </div>
            {days.map((day) => (
              <div
                className="border-b border-l border-[var(--line)] bg-[#f5f5ef] px-1.5 py-2.5 text-center text-xs font-semibold sm:px-2 sm:py-3"
                key={day.id}
              >
                {day.label}
              </div>
            ))}

            {rows.map((row, rowIndex) => (
              <Fragment key={row.label}>
                <div className="sticky left-0 z-10 border-r border-b border-[var(--line)] bg-[var(--surface)] px-1.5 py-2.5 text-xs font-medium text-[var(--muted)] sm:px-2 sm:py-3">
                  {row.label.split(" -> ")[0]}
                </div>
                {days.map((day) => {
                  const cell = day.cells[rowIndex];
                  const selected = selectedIds.has(cell.id);

                  return (
                    <button
                      aria-label={`${cell.dayLabel} ${cell.label}`}
                      aria-pressed={selected}
                      className={`sl-availability-cell min-h-12 touch-none border-b border-l border-[var(--line)] px-1.5 py-2.5 text-left text-xs active:scale-[0.99] sm:min-h-14 sm:px-2 sm:py-3 ${
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
      </div>

      <button
        className="sl-button sl-button-primary w-full px-5 py-3"
        disabled={isPending || !isDirty}
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
    const dayIndex = days.length;
    const dayId = toDateInputValue(day);
    const dayLabel = new Intl.DateTimeFormat("en", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(day);

    days.push({
      id: dayId,
      label: dayLabel,
      isWeekday: isWeekday(day),
      cells: range(startMinutes, endMinutes, slotSizeMinutes).map(
        (minutes, rowIndex) => {
          const startAt = new Date(
            day.getFullYear(),
            day.getMonth(),
            day.getDate(),
            Math.floor(minutes / 60),
            minutes % 60,
          );
          const endAt = new Date(
            startAt.getTime() + slotSizeMinutes * 60 * 1000,
          );

          return {
            id: `${dayId}-${minutes}`,
            dayLabel,
            dayIndex,
            rowIndex,
            startMinutes: minutes,
            endMinutes: minutes + slotSizeMinutes,
            label: `${formatHour(startAt)} -> ${formatHour(endAt)}`,
            start: startAt.toISOString(),
            end: endAt.toISOString(),
          };
        },
      ),
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

function isWeekday(value: Date): boolean {
  const day = value.getDay();
  return day >= 1 && day <= 5;
}

function formatHour(value: Date): string {
  return new Intl.DateTimeFormat("en", {
    hour12: false,
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

function areSetsEqual(
  left: ReadonlySet<string>,
  right: ReadonlySet<string>,
): boolean {
  if (left.size !== right.size) {
    return false;
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false;
    }
  }

  return true;
}
