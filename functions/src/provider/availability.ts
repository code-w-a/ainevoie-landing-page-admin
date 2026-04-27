import { HttpsError } from "firebase-functions/v2/https";

export type TimeRangeInput = {
  id?: string;
  startTime?: string;
  endTime?: string;
};

export type WeekDayInput = {
  dayKey?: string;
  label?: string;
  shortLabel?: string;
  isEnabled?: boolean;
  timeRanges?: TimeRangeInput[];
};

export type NormalizedTimeRange = {
  id: string;
  startTime: string;
  endTime: string;
};

export type NormalizedWeekDay = {
  dayKey: string;
  label: string;
  shortLabel: string;
  isEnabled: boolean;
  timeRanges: NormalizedTimeRange[];
};

const DAYS = [
  { dayKey: "monday", label: "Luni", shortLabel: "Lu" },
  { dayKey: "tuesday", label: "Marți", shortLabel: "Ma" },
  { dayKey: "wednesday", label: "Miercuri", shortLabel: "Mi" },
  { dayKey: "thursday", label: "Joi", shortLabel: "Jo" },
  { dayKey: "friday", label: "Vineri", shortLabel: "Vi" },
  { dayKey: "saturday", label: "Sâmbătă", shortLabel: "Sâ" },
  { dayKey: "sunday", label: "Duminică", shortLabel: "Du" },
] as const;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function minutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function normalizeRange(
  range: TimeRangeInput,
  index: number
): NormalizedTimeRange {
  const startTime = typeof range.startTime === "string" ? range.startTime.trim() : "";
  const endTime = typeof range.endTime === "string" ? range.endTime.trim() : "";

  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
    throw new HttpsError("invalid-argument", "Intervalele trebuie să folosească formatul HH:mm.");
  }
  if (minutes(startTime) >= minutes(endTime)) {
    throw new HttpsError("invalid-argument", "Ora de început trebuie să fie înaintea orei de final.");
  }

  return {
    id:
      typeof range.id === "string" && range.id.trim()
        ? range.id.trim()
        : `range_${index + 1}`,
    startTime,
    endTime,
  };
}

export function normalizeProviderAvailability(input: unknown) {
  const rawWeekSchedule =
    input && typeof input === "object" && Array.isArray((input as any).weekSchedule)
      ? ((input as any).weekSchedule as WeekDayInput[])
      : [];

  if (!rawWeekSchedule.length) {
    throw new HttpsError("invalid-argument", "Configurează cel puțin o zi disponibilă.");
  }

  const byKey = new Map<string, WeekDayInput>();
  for (const rawDay of rawWeekSchedule) {
    if (typeof rawDay.dayKey === "string") {
      byKey.set(rawDay.dayKey, rawDay);
    }
  }

  const weekSchedule: NormalizedWeekDay[] = DAYS.map((day) => {
    const rawDay = byKey.get(day.dayKey);
    const enabled = rawDay?.isEnabled === true;
    const ranges = enabled
      ? (rawDay?.timeRanges || []).map(normalizeRange).sort((a, b) => minutes(a.startTime) - minutes(b.startTime))
      : [];

    for (let i = 1; i < ranges.length; i += 1) {
      if (minutes(ranges[i - 1].endTime) > minutes(ranges[i].startTime)) {
        throw new HttpsError("invalid-argument", "Intervalele de disponibilitate nu pot fi suprapuse.");
      }
    }

    if (enabled && ranges.length === 0) {
      throw new HttpsError("invalid-argument", "Fiecare zi activă trebuie să aibă cel puțin un interval.");
    }

    return {
      ...day,
      isEnabled: enabled,
      timeRanges: ranges,
    };
  });

  const enabledDays = weekSchedule.filter((day) => day.isEnabled && day.timeRanges.length);
  if (!enabledDays.length) {
    throw new HttpsError("failed-precondition", "Configurează cel puțin o zi disponibilă.");
  }

  const availabilityDayChips = enabledDays.map((day) => day.label);
  const availabilitySummary = enabledDays
    .map((day) => `${day.label}: ${day.timeRanges.map((range) => `${range.startTime}-${range.endTime}`).join(", ")}`)
    .join("; ");

  return {
    weekSchedule,
    blockedDates: [],
    availabilitySummary,
    availabilityDayChips,
    hasConfiguredAvailability: true,
  };
}
