import { describe, expect, it } from "vitest";
import {
  generatePlan,
  selectExercises,
  trainingDayCount,
  type PlannerExercise,
  type PlannerProfile,
} from "./planner";
const profile: PlannerProfile = {
  age_range: "18-29",
  experience: "advanced",
  primary_goal: "strength",
  days_per_week: 7,
  session_minutes: 45,
  equipment: [],
  preferred_domains: [],
  activity_level: "high",
  limitations: null,
};
const ex = (slug: string, equipment: string[], domain = "strength"): PlannerExercise => ({
  slug,
  name: slug,
  equipment,
  domain,
  difficulty: "beginner",
  pattern: "squat",
  cues: [],
  prescription: "3 × 8",
  high_intensity: false,
});
describe("profile constraints", () => {
  it("requires both barbell and rack", () =>
    expect(
      selectExercises(
        [ex("back-squat", ["barbell", "rack"])],
        "strength",
        { ...profile, equipment: ["barbell"] },
        4,
        0,
      ),
    ).toEqual([]));
  it("accepts a full required equipment combination", () =>
    expect(
      selectExercises(
        [ex("db-bench-press", ["dumbbell", "bench"])],
        "strength",
        { ...profile, equipment: ["dumbbell", "bench"] },
        4,
        0,
      ),
    ).toHaveLength(1));
  it("allows a kettlebell alternative for goblet squat", () =>
    expect(
      selectExercises(
        [ex("goblet-squat", ["dumbbell", "kettlebell"])],
        "strength",
        { ...profile, equipment: ["kettlebell"] },
        4,
        0,
      ),
    ).toHaveLength(1));
  it("treats no equipment requirements as bodyweight", () =>
    expect(selectExercises([ex("bodyweight", [])], "strength", profile, 4, 0)).toHaveLength(1));
  it("applies sedentary cap even for beginners", () =>
    expect(
      trainingDayCount({ ...profile, experience: "beginner", activity_level: "sedentary" }),
    ).toBe(3));
  it("honors selected domains rather than reintroducing goal domains", () =>
    expect(
      generatePlan({ ...profile, days_per_week: 3, preferred_domains: ["yoga"] }, [
        ex("yoga", [], "yoga"),
        ex("strength", []),
      ]).days.every((d) => d.domain === "yoga"),
    ).toBe(true));
  it("keeps the seventh day recovery without recovery catalogue entries", () =>
    expect(
      generatePlan(profile, [ex("strength", []), ex("mobility", [], "mobility")]).days.at(-1)
        ?.domain,
    ).toBe("recovery"));
  it("retains limitation filtering on mobility fallback", () =>
    expect(
      generatePlan({ ...profile, limitations: "back pain" }, [
        { ...ex("hinge", [], "mobility"), pattern: "hinge" },
      ]).days.flatMap((d) => d.blocks.main),
    ).toEqual([]));
  it("excludes high intensity for a missing experience", () =>
    expect(
      generatePlan({ ...profile, experience: null }, [
        { ...ex("hard", []), high_intensity: true },
      ]).days.flatMap((d) => d.blocks.main),
    ).toEqual([]));
});
