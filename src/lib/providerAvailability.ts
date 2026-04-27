export type ProviderTimeRange = {
  id: string;
  startTime: string;
  endTime: string;
};

export type ProviderWeekDay = {
  dayKey: string;
  label: string;
  shortLabel: string;
  isEnabled: boolean;
  timeRanges: ProviderTimeRange[];
};

export const PROVIDER_WEEK_DAYS: ProviderWeekDay[] = [
  {
    dayKey: "monday",
    label: "Luni",
    shortLabel: "Lu",
    isEnabled: true,
    timeRanges: [{ id: "range_1", startTime: "09:00", endTime: "17:00" }],
  },
  {
    dayKey: "tuesday",
    label: "Marți",
    shortLabel: "Ma",
    isEnabled: true,
    timeRanges: [{ id: "range_1", startTime: "09:00", endTime: "17:00" }],
  },
  {
    dayKey: "wednesday",
    label: "Miercuri",
    shortLabel: "Mi",
    isEnabled: true,
    timeRanges: [{ id: "range_1", startTime: "09:00", endTime: "17:00" }],
  },
  {
    dayKey: "thursday",
    label: "Joi",
    shortLabel: "Jo",
    isEnabled: true,
    timeRanges: [{ id: "range_1", startTime: "09:00", endTime: "17:00" }],
  },
  {
    dayKey: "friday",
    label: "Vineri",
    shortLabel: "Vi",
    isEnabled: true,
    timeRanges: [{ id: "range_1", startTime: "09:00", endTime: "17:00" }],
  },
  {
    dayKey: "saturday",
    label: "Sâmbătă",
    shortLabel: "Sâ",
    isEnabled: false,
    timeRanges: [{ id: "range_1", startTime: "09:00", endTime: "14:00" }],
  },
  {
    dayKey: "sunday",
    label: "Duminică",
    shortLabel: "Du",
    isEnabled: false,
    timeRanges: [{ id: "range_1", startTime: "09:00", endTime: "14:00" }],
  },
];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function minutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export function cloneDefaultProviderWeekSchedule() {
  return PROVIDER_WEEK_DAYS.map((day) => ({
    ...day,
    timeRanges: day.timeRanges.map((range) => ({ ...range })),
  }));
}

export function validateProviderWeekSchedule(weekSchedule: ProviderWeekDay[]) {
  const enabledDays = weekSchedule.filter((day) => day.isEnabled);
  if (!enabledDays.length) {
    return "Configurează cel puțin o zi disponibilă.";
  }

  for (const day of enabledDays) {
    if (!day.timeRanges.length) {
      return `${day.label}: adaugă cel puțin un interval.`;
    }

    const ranges = [...day.timeRanges].sort(
      (a, b) => minutes(a.startTime) - minutes(b.startTime)
    );

    for (const range of ranges) {
      if (!TIME_RE.test(range.startTime) || !TIME_RE.test(range.endTime)) {
        return `${day.label}: intervalele trebuie să folosească formatul HH:mm.`;
      }
      if (minutes(range.startTime) >= minutes(range.endTime)) {
        return `${day.label}: ora de început trebuie să fie înaintea orei de final.`;
      }
    }

    for (let index = 1; index < ranges.length; index += 1) {
      if (minutes(ranges[index - 1].endTime) > minutes(ranges[index].startTime)) {
        return `${day.label}: intervalele nu pot fi suprapuse.`;
      }
    }
  }

  return null;
}
