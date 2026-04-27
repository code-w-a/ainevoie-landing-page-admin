import { describe, expect, it } from "vitest";
import {
  cloneDefaultProviderWeekSchedule,
  validateProviderWeekSchedule,
} from "../providerAvailability";

describe("provider availability helpers", () => {
  it("accepts the default schedule", () => {
    expect(validateProviderWeekSchedule(cloneDefaultProviderWeekSchedule())).toBeNull();
  });

  it("requires at least one enabled day", () => {
    const schedule = cloneDefaultProviderWeekSchedule().map((day) => ({
      ...day,
      isEnabled: false,
    }));

    expect(validateProviderWeekSchedule(schedule)).toBe(
      "Configurează cel puțin o zi disponibilă."
    );
  });

  it("rejects invalid time ranges", () => {
    const schedule = cloneDefaultProviderWeekSchedule();
    schedule[0].timeRanges[0].startTime = "18:00";
    schedule[0].timeRanges[0].endTime = "09:00";

    expect(validateProviderWeekSchedule(schedule)).toContain(
      "ora de început trebuie să fie înaintea orei de final"
    );
  });
});
