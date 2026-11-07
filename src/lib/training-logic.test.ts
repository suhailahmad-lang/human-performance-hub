import { describe, expect, it } from "vitest";
import { completionSchema, rangeStart, sessionSummary } from "./training-logic";
const valid = {
  workoutId: "00000000-0000-4000-8000-000000000001",
  status: "completed",
  duration: 45,
  rpe: 6,
  notes: null,
  date: "2026-11-07",
  sets: [
    {
      exercise_name: "Squat",
      set_number: 1,
      reps: 10,
      load_kg: 20.5,
      seconds: null,
      distance_m: null,
    },
  ],
};
describe("workout validation", () => {
  it("accepts valid logs including decimal loads", () =>
    expect(completionSchema.safeParse(valid).success).toBe(true));
  it.each([NaN, -1, 1.5, 1001])("rejects invalid reps %s", (reps) =>
    expect(
      completionSchema.safeParse({ ...valid, sets: [{ ...valid.sets[0], reps }] }).success,
    ).toBe(false),
  );
  it.each([NaN, 0, 11, 1.5])("rejects invalid RPE %s", (rpe) =>
    expect(completionSchema.safeParse({ ...valid, rpe }).success).toBe(false),
  );
  it("requires duration for completed workouts", () =>
    expect(completionSchema.safeParse({ ...valid, duration: 0 }).success).toBe(false));
  it("allows skipping with no work logged", () =>
    expect(
      completionSchema.safeParse({ ...valid, status: "skipped", duration: 0, rpe: null, sets: [] })
        .success,
    ).toBe(true));
  it("retains original set numbering", () =>
    expect(
      completionSchema.parse({ ...valid, sets: [{ ...valid.sets[0], set_number: 3 }] }).sets[0]
        ?.set_number,
    ).toBe(3));
});
describe("analytics", () => {
  it.each([
    [7, "2026-11-01"],
    [30, "2026-10-09"],
    [90, "2026-08-10"],
  ])("uses %s inclusive calendar days", (days, start) =>
    expect(rangeStart(Number(days), new Date(2026, 10, 7))).toBe(start),
  );
  it("counts modified sessions but not skipped or unfinished work", () => {
    const result = sessionSummary([
      { status: "completed", duration_min: 40, rpe: 6 },
      { status: "modified", duration_min: 20, rpe: 4 },
      { status: "skipped", duration_min: 0, rpe: null },
      { status: "planned", duration_min: 45, rpe: 8 },
    ]);
    expect(result.done).toHaveLength(2);
    expect(result.minutes).toBe(60);
    expect(result.skipped).toBe(1);
    expect(result.avgRpe).toBe("5.0");
  });
});
