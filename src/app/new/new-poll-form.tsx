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
const resolutionOptions = [
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
  duration_invalid: "Choose a supported event duration.",
  slot_size_invalid: "Choose a supported grid resolution.",
  create_event_failed: "The poll could not be created. Try again.",
};

const initialCreateEventActionState = {
  status: "idle" as const,
  errors: [] as readonly string[],
};

export function NewPollForm() {
  const [state, formAction, isPending] = useActionState(
    createEventAction,
    initialCreateEventActionState,
  );

  return (
    <form
      action={formAction}
      className="mt-8 space-y-5 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-5"
    >
      {state.status === "error" ? (
        <div
          className="rounded-[8px] border border-[#e6b8a8] bg-[#fff5ef] px-3 py-3 text-sm text-[#8a351e]"
          role="alert"
        >
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
          className="mt-2 w-full rounded-[8px] border border-[var(--line)] px-3 py-3 outline-none focus:border-[var(--primary)]"
          maxLength={80}
          name="title"
          placeholder="Board Game Night"
          required
          type="text"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Start date</span>
          <input
            className="mt-2 w-full rounded-[8px] border border-[var(--line)] px-3 py-3 outline-none focus:border-[var(--primary)]"
            name="startDate"
            required
            type="date"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">End date</span>
          <input
            className="mt-2 w-full rounded-[8px] border border-[var(--line)] px-3 py-3 outline-none focus:border-[var(--primary)]"
            name="endDate"
            required
            type="date"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Event duration</span>
          <select
            className="mt-2 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 py-3 outline-none focus:border-[var(--primary)]"
            defaultValue={60}
            name="durationMinutes"
          >
            {durationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Grid resolution</span>
          <select
            className="mt-2 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 py-3 outline-none focus:border-[var(--primary)]"
            defaultValue={30}
            name="slotSizeMinutes"
          >
            {resolutionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        className="w-full rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)] disabled:cursor-not-allowed disabled:opacity-65"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Creating..." : "Create Event"}
      </button>
    </form>
  );
}
