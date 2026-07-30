const minuteMs = 60 * 1000;
const dayMs = 24 * 60 * minuteMs;

export const allowedDurationMinutes = [30, 60, 120, 180, 240] as const;
export const allowedSlotSizeMinutes = [30, 60] as const;

export type DurationMinutes = (typeof allowedDurationMinutes)[number];
export type SlotSizeMinutes = (typeof allowedSlotSizeMinutes)[number];

export interface EventDraft {
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly durationMinutes: number;
  readonly slotSizeMinutes: number;
  readonly isFullDay?: boolean;
}

export interface ValidEventDraft {
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly durationMinutes: DurationMinutes;
  readonly slotSizeMinutes: SlotSizeMinutes;
  readonly isFullDay: boolean;
}

export interface Participant {
  readonly id: string;
  readonly name: string;
  readonly timezone: string;
}

export interface AvailabilityWindow {
  readonly participantId: string;
  readonly start: string;
  readonly end: string;
}

export interface RankedSlot {
  readonly start: string;
  readonly end: string;
  readonly availableCount: number;
  readonly availableParticipants: readonly Participant[];
  readonly missingParticipants: readonly Participant[];
}

export interface RankAvailabilityInput {
  readonly participants: readonly Participant[];
  readonly availability: readonly AvailabilityWindow[];
  readonly durationMinutes: number;
  readonly slotSizeMinutes: number;
}

export interface RankFullDayAvailabilityInput {
  readonly participants: readonly Participant[];
  readonly availability: readonly AvailabilityWindow[];
  readonly startDate: string;
  readonly endDate: string;
}

type MillisecondWindow = {
  readonly participantId: string;
  readonly startMs: number;
  readonly endMs: number;
};

export function validateEventDraft(
  draft: EventDraft,
):
  | { readonly valid: true; readonly value: ValidEventDraft }
  | { readonly valid: false; readonly errors: readonly string[] } {
  const errors: string[] = [];
  const title = draft.title.trim();
  const isFullDay = draft.isFullDay === true;

  if (title.length === 0) {
    errors.push("title_required");
  }

  if (title.length > 80) {
    errors.push("title_too_long");
  }

  if (!isDateOnly(draft.startDate)) {
    errors.push("start_date_invalid");
  }

  if (!isDateOnly(draft.endDate)) {
    errors.push("end_date_invalid");
  }

  if (!isFullDay && !isTimeOnly(draft.startTime)) {
    errors.push("start_time_invalid");
  }

  if (!isFullDay && !isTimeOnly(draft.endTime)) {
    errors.push("end_time_invalid");
  }

  if (
    isDateOnly(draft.startDate) &&
    isDateOnly(draft.endDate) &&
    toDateOnlyMs(draft.startDate) > toDateOnlyMs(draft.endDate)
  ) {
    errors.push("date_range_invalid");
  }

  if (
    isDateOnly(draft.startDate) &&
    isDateOnly(draft.endDate) &&
    toDateOnlyMs(draft.endDate) - toDateOnlyMs(draft.startDate) > 31 * dayMs
  ) {
    errors.push("date_range_too_long");
  }

  if (!isFullDay && !isAllowedDuration(draft.durationMinutes)) {
    errors.push("duration_invalid");
  }

  if (!isFullDay && !isAllowedSlotSize(draft.slotSizeMinutes)) {
    errors.push("slot_size_invalid");
  }

  if (
    !isFullDay &&
    isTimeOnly(draft.startTime) &&
    isTimeOnly(draft.endTime) &&
    timeToMinutes(draft.startTime) >= timeToMinutes(draft.endTime)
  ) {
    errors.push("time_range_invalid");
  }

  if (
    !isFullDay &&
    isTimeOnly(draft.startTime) &&
    isTimeOnly(draft.endTime) &&
    isAllowedDuration(draft.durationMinutes) &&
    timeToMinutes(draft.endTime) - timeToMinutes(draft.startTime) <
      draft.durationMinutes
  ) {
    errors.push("duration_exceeds_time_range");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    value: {
      title,
      startDate: draft.startDate,
      endDate: draft.endDate,
      startTime: isFullDay ? "00:00" : draft.startTime,
      endTime: isFullDay ? "23:59" : draft.endTime,
      durationMinutes: isFullDay
        ? 60
        : (draft.durationMinutes as DurationMinutes),
      slotSizeMinutes: isFullDay
        ? 60
        : (draft.slotSizeMinutes as SlotSizeMinutes),
      isFullDay,
    },
  };
}

export function normalizeParticipantName(name: string): string {
  return name
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
}

export function isValidTimeZone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export function rankAvailabilitySlots(
  input: RankAvailabilityInput,
): RankedSlot[] {
  assertAllowedDuration(input.durationMinutes);
  assertAllowedSlotSize(input.slotSizeMinutes);

  const participantById = new Map(
    input.participants.map((participant) => [participant.id, participant]),
  );
  const windows = mergeWindows(
    normalizeWindows(input.availability, participantById),
  );
  const windowsByParticipant = groupWindowsByParticipant(windows);
  const candidateSlots = getCandidateSlots(
    windows,
    input.durationMinutes,
    input.slotSizeMinutes,
  );

  return candidateSlots
    .map(({ startMs, endMs }) => {
      const availableParticipants = input.participants.filter((participant) =>
        isParticipantAvailable(
          windowsByParticipant.get(participant.id) ?? [],
          startMs,
          endMs,
        ),
      );
      const availableIds = new Set(
        availableParticipants.map((participant) => participant.id),
      );
      const missingParticipants = input.participants.filter(
        (participant) => !availableIds.has(participant.id),
      );

      return {
        start: new Date(startMs).toISOString(),
        end: new Date(endMs).toISOString(),
        availableCount: availableParticipants.length,
        availableParticipants,
        missingParticipants,
      };
    })
    .filter((slot) => slot.availableCount > 0)
    .sort(
      (left, right) =>
        right.availableCount - left.availableCount ||
        Date.parse(left.start) - Date.parse(right.start) ||
        Date.parse(left.end) - Date.parse(right.end),
    );
}

export function rankFullDayAvailabilitySlots(
  input: RankFullDayAvailabilityInput,
): RankedSlot[] {
  if (!isDateOnly(input.startDate) || !isDateOnly(input.endDate)) {
    throw new Error("Invalid full-day date range");
  }

  const participantById = new Map(
    input.participants.map((participant) => [participant.id, participant]),
  );
  const windows = mergeWindows(
    normalizeWindows(input.availability, participantById),
  );
  const windowsByParticipant = groupWindowsByParticipant(windows);
  const candidateDays = getCandidateDays(input.startDate, input.endDate);

  return candidateDays
    .map(({ startMs, endMs }) => {
      const availableParticipants = input.participants.filter((participant) =>
        isParticipantAvailable(
          windowsByParticipant.get(participant.id) ?? [],
          startMs,
          endMs,
        ),
      );
      const availableIds = new Set(
        availableParticipants.map((participant) => participant.id),
      );
      const missingParticipants = input.participants.filter(
        (participant) => !availableIds.has(participant.id),
      );

      return {
        start: new Date(startMs).toISOString(),
        end: new Date(endMs).toISOString(),
        availableCount: availableParticipants.length,
        availableParticipants,
        missingParticipants,
      };
    })
    .filter((slot) => slot.availableCount > 0)
    .sort(
      (left, right) =>
        right.availableCount - left.availableCount ||
        Date.parse(left.start) - Date.parse(right.start),
    );
}

function mergeWindows(
  windows: readonly MillisecondWindow[],
): MillisecondWindow[] {
  const merged: MillisecondWindow[] = [];

  for (const window of windows) {
    const previous = merged.at(-1);

    if (
      previous &&
      previous.participantId === window.participantId &&
      previous.endMs >= window.startMs
    ) {
      merged[merged.length - 1] = {
        participantId: previous.participantId,
        startMs: previous.startMs,
        endMs: Math.max(previous.endMs, window.endMs),
      };
      continue;
    }

    merged.push(window);
  }

  return merged;
}

function normalizeWindows(
  availability: readonly AvailabilityWindow[],
  participantById: ReadonlyMap<string, Participant>,
): MillisecondWindow[] {
  return availability
    .map((window) => {
      if (!participantById.has(window.participantId)) {
        throw new Error(`Unknown participant: ${window.participantId}`);
      }

      const startMs = parseInstant(window.start);
      const endMs = parseInstant(window.end);

      if (startMs >= endMs) {
        throw new Error("Availability window end must be after start");
      }

      return {
        participantId: window.participantId,
        startMs,
        endMs,
      };
    })
    .sort(
      (left, right) =>
        left.participantId.localeCompare(right.participantId) ||
        left.startMs - right.startMs ||
        left.endMs - right.endMs,
    );
}

function groupWindowsByParticipant(
  windows: readonly MillisecondWindow[],
): Map<string, MillisecondWindow[]> {
  const grouped = new Map<string, MillisecondWindow[]>();

  for (const window of windows) {
    const participantWindows = grouped.get(window.participantId) ?? [];
    participantWindows.push(window);
    grouped.set(window.participantId, participantWindows);
  }

  return grouped;
}

function getCandidateSlots(
  windows: readonly MillisecondWindow[],
  durationMinutes: number,
  slotSizeMinutes: number,
): Array<{ readonly startMs: number; readonly endMs: number }> {
  const durationMs = durationMinutes * minuteMs;
  const stepMs = slotSizeMinutes * minuteMs;
  const slotsByKey = new Map<
    string,
    { readonly startMs: number; readonly endMs: number }
  >();

  for (const window of windows) {
    for (
      let startMs = ceilToStep(window.startMs, stepMs);
      startMs + durationMs <= window.endMs;
      startMs += stepMs
    ) {
      const endMs = startMs + durationMs;
      slotsByKey.set(`${startMs}:${endMs}`, { startMs, endMs });
    }
  }

  return Array.from(slotsByKey.values()).sort(
    (left, right) => left.startMs - right.startMs || left.endMs - right.endMs,
  );
}

function getCandidateDays(
  startDate: string,
  endDate: string,
): Array<{ readonly startMs: number; readonly endMs: number }> {
  const startMs = toDateOnlyMs(startDate);
  const endMs = toDateOnlyMs(endDate);
  const days: Array<{ readonly startMs: number; readonly endMs: number }> = [];

  for (let dayStartMs = startMs; dayStartMs <= endMs; dayStartMs += dayMs) {
    days.push({ startMs: dayStartMs, endMs: dayStartMs + dayMs });
  }

  return days;
}

function isParticipantAvailable(
  windows: readonly MillisecondWindow[],
  startMs: number,
  endMs: number,
): boolean {
  return windows.some(
    (window) => window.startMs <= startMs && window.endMs >= endMs,
  );
}

function isAllowedDuration(value: number): value is DurationMinutes {
  return allowedDurationMinutes.includes(value as DurationMinutes);
}

function isAllowedSlotSize(value: number): value is SlotSizeMinutes {
  return allowedSlotSizeMinutes.includes(value as SlotSizeMinutes);
}

function assertAllowedDuration(
  value: number,
): asserts value is DurationMinutes {
  if (!isAllowedDuration(value)) {
    throw new Error(`Unsupported duration: ${value}`);
  }
}

function assertAllowedSlotSize(
  value: number,
): asserts value is SlotSizeMinutes {
  if (!isAllowedSlotSize(value)) {
    throw new Error(`Unsupported slot size: ${value}`);
  }
}

function isDateOnly(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(toDateOnlyMs(value))
  );
}

function isTimeOnly(value: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return false;
  }

  const [hours, minutes] = value.split(":").map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function toDateOnlyMs(value: string): number {
  return Date.parse(`${value}T00:00:00.000Z`);
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function parseInstant(value: string): number {
  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid instant: ${value}`);
  }

  return parsed;
}

function ceilToStep(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}
