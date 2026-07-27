"use client";

import { useActionState } from "react";
import { messages, type Locale } from "@/i18n/messages";
import { createEventAction } from "./actions";

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

interface NewPollFormProps {
  readonly locale: Locale;
}

export function NewPollForm({ locale }: NewPollFormProps) {
  const [state, formAction, isPending] = useActionState(
    createEventAction,
    initialCreateEventActionState,
  );
  const t = messages[locale];
  const durationOptions = [
    { label: t.create.durations.minutes30, value: 30 },
    { label: t.create.durations.hour1, value: 60 },
    { label: t.create.durations.hours2, value: 120 },
    { label: t.create.durations.hours3, value: 180 },
    { label: t.create.durations.hours4, value: 240 },
  ];
  const slotSizeOptions = [
    { label: t.create.durations.minutes30, value: 30 },
    { label: t.create.durations.hour1, value: 60 },
  ];

  return (
    <form action={formAction} className="sl-panel mt-8 space-y-5 p-5">
      {state.status === "error" ? (
        <div className="sl-alert sl-alert-error" role="alert">
          <ul className="space-y-1">
            {state.errors.map((error) => (
              <li key={error}>
                {t.create.errors[error as keyof typeof t.create.errors] ??
                  t.common.fallbackError}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium">{t.create.fields.title}</span>
        <input
          className="sl-field mt-2"
          defaultValue={state.values.title}
          maxLength={80}
          name="title"
          placeholder={t.create.fields.titlePlaceholder}
          required
          type="text"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">
            {t.create.fields.startDate}
          </span>
          <input
            className="sl-field mt-2"
            defaultValue={state.values.startDate}
            name="startDate"
            required
            type="date"
          />
          <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
            {t.create.fields.startDateHelp}
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-medium">{t.create.fields.endDate}</span>
          <input
            className="sl-field mt-2"
            defaultValue={state.values.endDate}
            name="endDate"
            required
            type="date"
          />
          <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
            {t.create.fields.endDateHelp}
          </span>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">
            {t.create.fields.startTime}
          </span>
          <input
            className="sl-field mt-2"
            defaultValue={state.values.startTime}
            name="startTime"
            required
            type="time"
          />
          <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
            {t.create.fields.startTimeHelp}
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-medium">{t.create.fields.endTime}</span>
          <input
            className="sl-field mt-2"
            defaultValue={state.values.endTime}
            name="endTime"
            required
            type="time"
          />
          <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
            {t.create.fields.endTimeHelp}
          </span>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">
            {t.create.fields.duration}
          </span>
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
            {t.create.fields.durationHelp}
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-medium">
            {t.create.fields.slotSize}
          </span>
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
            {t.create.fields.slotSizeHelp}
          </span>
        </label>
      </div>

      <button
        className="sl-button sl-button-primary w-full px-5 py-3"
        disabled={isPending}
        type="submit"
      >
        {isPending ? t.create.creating : t.create.submit}
      </button>
    </form>
  );
}
