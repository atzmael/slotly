"use client";

import { useActionState } from "react";
import { createEventAction } from "./actions";

const durationOptions = [
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "3 hours", value: 180 },
  { label: "4 hours", value: 240 },
];
const slotSizeOptions = [
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
];

const errorCopy: Record<string, string> = {
  title_required: "Add an event name.",
  title_too_long: "Keep the event name under 80 characters.",
  start_date_invalid: "Choose a valid start date.",
  end_date_invalid: "Choose a valid end date.",
  date_range_invalid: "End date must be after the start date.",
  date_range_too_long: "Keep the date range to 31 days or less.",
  start_time_invalid: "Choose a valid start time.",
  end_time_invalid: "Choose a valid end time.",
  time_range_invalid: "End time must be after the start time.",
  duration_exceeds_time_range: "Event duration must fit inside the time range.",
  duration_invalid: "Choose a supported event duration.",
  slot_size_invalid: "Choose a supported slot size.",
  database_migration_required:
    "The database is not up to date. Apply the latest Supabase migration, then try again.",
  create_event_failed: "The poll could not be created. Try again.",
};

const initialCreateEventActionState = {
  status: "idle" as const,
  errors: [] as readonly string[],
  values: {
    title: "",
    startDate: "",
    endDate: "",
    startTime: "18:00",
    endTime: "22:00",
    durationMinutes: 60,
    slotSizeMinutes: 60,
  },
};

export function NewPollForm() {
  const [state, formAction, isPending] = useActionState(
    createEventAction,
    initialCreateEventActionState,
  );

  return (
    <form action={formAction} className="sl-panel mt-8 space-y-5 p-5">
      {state.status === "error" ? (
        <div className="sl-alert sl-alert-error" role="alert">
          <ul className="space-y-1">
            {state.errors.map((error) => (
              <li key={error}>{errorCopy[error] ?? "Something went wrong."}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium">Event name</span>
        <input
          className="sl-field mt-2"
          defaultValue={state.values.title}
          maxLength={80}
          name="title"
          placeholder="Réunion pôle communication, Restaurant avec la famille, ..."
          required
          type="text"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Start date</span>
          <input
            className="sl-field mt-2"
            defaultValue={state.values.startDate}
            name="startDate"
            required
            type="date"
          />
          <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
            First day participants can pick availability.
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-medium">End date</span>
          <input
            className="sl-field mt-2"
            defaultValue={state.values.endDate}
            name="endDate"
            required
            type="date"
          />
          <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
            Last day included in the poll.
          </span>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Start time</span>
          <input
            className="sl-field mt-2"
            defaultValue={state.values.startTime}
            name="startTime"
            required
            type="time"
          />
          <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
            Earliest time shown each day.
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-medium">End time</span>
          <input
            className="sl-field mt-2"
            defaultValue={state.values.endTime}
            name="endTime"
            required
            type="time"
          />
          <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
            Latest time shown each day.
          </span>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Event duration</span>
          <select
            className="sl-field mt-2"
            defaultValue={state.values.durationMinutes}
            name="durationMinutes"
          >
            {durationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
            Length of the meeting you want to schedule.
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Slot size</span>
          <select
            className="sl-field mt-2"
            defaultValue={state.values.slotSizeMinutes}
            name="slotSizeMinutes"
          >
            {slotSizeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
            Precision of the availability grid.
          </span>
        </label>
      </div>

      <button
        className="sl-button sl-button-primary w-full px-5 py-3"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Creating..." : "Create Event"}
      </button>
    </form>
  );
}
