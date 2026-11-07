import { describe, expect, it } from "vitest";
import { generatePlan, type PlannerExercise, type PlannerProfile } from "./planner";

const cat: PlannerExercise[] = [
  {
    slug: "push-up",
    name: "Push-Up",
    domain: "calisthenics",
    difficulty: "beginner",
    equipment: ["none"],
    pattern: "push",
    cues: [],
    prescription: "",
    high_intensity: false,
  },
  {
    slug: "goblet",
    name: "Goblet",
    domain: "strength",
    difficulty: "beginner",
    equipment: ["dumbbell"],
    pattern: "squat",
    cues: [],
    prescription: "",
    high_intensity: false,
  },
  {
    slug: "box-jump",
    name: "Box",
    domain: "plyometrics",
    difficulty: "intermediate",
    equipment: ["none"],
    pattern: "jump",
    cues: [],
    prescription: "",
    high_intensity: true,
  },
  {
    slug: "pogo",
    name: "Pogo",
    domain: "plyometrics",
    difficulty: "beginner",
    equipment: ["none"],
    pattern: "jump",
    cues: [],
    prescription: "",
    high_intensity: false,
  },
  {
    slug: "accel",
    name: "Accel",
    domain: "sprint",
    difficulty: "intermediate",
    equipment: ["none"],
    pattern: "locomotion",
    cues: [],
    prescription: "",
    high_intensity: true,
  },
  {
    slug: "wgs",
    name: "WGS",
    domain: "mobility",
    difficulty: "beginner",
    equipment: ["none"],
    pattern: "mobility",
    cues: [],
    prescription: "",
    high_intensity: false,
  },
  {
    slug: "walk",
    name: "Walk",
    domain: "cardio",
    difficulty: "beginner",
    equipment: ["none"],
    pattern: "locomotion",
    cues: [],
    prescription: "",
    high_intensity: false,
  },
];

const base: PlannerProfile = {
  age_range: "18-29",
  experience: "advanced",
  primary_goal: "speed",
  days_per_week: 6,
  session_minutes: 45,
  equipment: [],
  preferred_domains: [],
  activity_level: "high",
  limitations: null,
};

const allMain = (p: PlannerProfile) =>
  generatePlan(p, cat).days.flatMap((d) => d.blocks.main.map((m) => m.slug));

describe("planner rules", () => {
  it("caps beginners at 4 training days", () => {
    expect(
      generatePlan({ ...base, experience: "beginner", days_per_week: 6 }, cat).days,
    ).toHaveLength(4);
  });
  it("caps under-18 users at 4 days and excludes high-intensity work", () => {
    const p = { ...base, age_range: "under-18", days_per_week: 6 };
    expect(generatePlan(p, cat).days).toHaveLength(4);
    expect(allMain(p)).not.toContain("box-jump");
    expect(allMain(p)).not.toContain("accel");
  });
  it("never places demanding domains on consecutive days", () => {
    const days = generatePlan(base, cat).days;
    const demanding = new Set(["sprint", "plyometrics", "combat"]);
    for (let i = 1; i < days.length; i++) {
      const current = days[i];
      const previous = days[i - 1];
      if (current && previous && current.dayOffset - previous.dayOffset === 1) {
        expect(demanding.has(current.domain) && demanding.has(previous.domain)).toBe(false);
      }
    }
  });
  it("removes jumping for a knee limitation", () => {
    expect(allMain({ ...base, limitations: "Left knee pain" })).not.toContain("pogo");
  });
  it("only prescribes equipment the user has", () => {
    expect(allMain({ ...base, primary_goal: "strength", equipment: [] })).not.toContain("goblet");
  });
});
