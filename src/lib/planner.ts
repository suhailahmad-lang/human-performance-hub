/**
 * Deterministic, rules-based weekly planner. No AI model is involved:
 * the same profile + catalogue always produces the same plan.
 */
import {
  ALWAYS_AVAILABLE,
  domainById,
  equipmentMatches,
  isDomainId,
  type DomainId,
} from "./domains";

export type Experience = "beginner" | "intermediate" | "advanced";
export type Intensity = "low" | "moderate" | "high";

export interface PlannerProfile {
  age_range: string | null;
  experience: Experience | null;
  primary_goal: string | null;
  days_per_week: number | null;
  session_minutes: number | null;
  equipment: string[];
  preferred_domains: string[];
  activity_level: string | null;
  limitations: string | null;
}

export interface PlannerExercise {
  slug: string;
  name: string;
  domain: string;
  difficulty: Experience;
  equipment: string[];
  pattern: string;
  cues: string[];
  prescription: string;
  high_intensity: boolean;
}

export interface BlockItem {
  slug?: string;
  name: string;
  prescription: string;
  cues: string[];
}

export interface WorkoutBlocks {
  warmup: BlockItem[];
  main: BlockItem[];
  cooldown: BlockItem[];
}

export interface PlannedDay {
  dayOffset: number;
  domain: DomainId;
  title: string;
  focus: string;
  duration_min: number;
  intensity: Intensity;
  blocks: WorkoutBlocks;
}

export interface GeneratedPlan {
  rationale: string[];
  safety_notes: string[];
  days: PlannedDay[];
}

const LEVEL: Record<Experience, number> = { beginner: 0, intermediate: 1, advanced: 2 };

export const GOAL_DOMAINS: Record<string, DomainId[]> = {
  strength: ["strength", "calisthenics", "mobility"],
  endurance: ["endurance", "cardio", "mobility"],
  speed: ["sprint", "plyometrics", "strength"],
  general: ["strength", "cardio", "mobility"],
  combat: ["combat", "strength", "cardio"],
  wellbeing: ["yoga", "mobility", "recovery"],
};

/** Spread training days across the 7-day window to protect recovery. */
export const DAY_PATTERNS: Record<number, number[]> = {
  1: [0],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
  7: [0, 1, 2, 3, 4, 5, 6],
};

const LIMITATION_RULES: {
  keywords: string[];
  patterns: string[];
  domains: DomainId[];
  label: string;
}[] = [
  { keywords: ["knee"], patterns: ["jump"], domains: ["plyometrics", "sprint"], label: "knee" },
  { keywords: ["back", "spine", "lumbar"], patterns: ["hinge"], domains: [], label: "back" },
  { keywords: ["shoulder"], patterns: ["push"], domains: [], label: "shoulder" },
  {
    keywords: ["ankle", "achilles"],
    patterns: ["jump"],
    domains: ["plyometrics", "sprint"],
    label: "ankle",
  },
  { keywords: ["wrist"], patterns: ["striking"], domains: [], label: "wrist" },
];

const WARMUPS: Record<"active" | "calm", BlockItem[]> = {
  active: [
    { name: "Easy cardio raise", prescription: "3–5 min", cues: ["Gradually raise heart rate"] },
    {
      name: "World's Greatest Stretch",
      slug: "worlds-greatest",
      prescription: "5 each side",
      cues: ["Move slowly through range"],
    },
    {
      name: "Movement rehearsal",
      prescription: "2 light sets of first exercise",
      cues: ["Groove technique before loading"],
    },
  ],
  calm: [
    {
      name: "Box Breathing",
      slug: "box-breathing",
      prescription: "2 min",
      cues: ["Inhale 4, hold 4, exhale 4, hold 4"],
    },
    {
      name: "Gentle joint circles",
      prescription: "2 min",
      cues: ["Neck, shoulders, hips, ankles"],
    },
  ],
};

const COOLDOWNS: Record<"active" | "calm", BlockItem[]> = {
  active: [
    { name: "Easy walk", prescription: "3–5 min", cues: ["Let breathing settle"] },
    { name: "90/90 Hip Switches", slug: "90-90", prescription: "8 switches", cues: ["Tall spine"] },
  ],
  calm: [
    {
      name: "Body Scan",
      slug: "body-scan",
      prescription: "3–5 min",
      cues: ["Notice without judging"],
    },
  ],
};

export function isMinor(ageRange: string | null) {
  return ageRange === "under-18";
}

export function trainingDayCount(p: PlannerProfile): number {
  const requested = Math.min(
    7,
    Math.max(1, Math.floor(Number.isFinite(p.days_per_week) ? (p.days_per_week ?? 3) : 3)),
  );
  if (p.activity_level === "sedentary") return Math.min(requested, 3);
  if (isMinor(p.age_range)) return Math.min(requested, 4);
  if ((p.experience ?? "beginner") === "beginner") return Math.min(requested, 4);
  if (p.activity_level === "sedentary") return Math.min(requested, 3);
  return requested;
}

export function activeLimitations(text: string | null) {
  const t = (text ?? "").toLowerCase();
  return LIMITATION_RULES.filter((r) => r.keywords.some((k) => t.includes(k)));
}

export function allowHighIntensity(p: PlannerProfile) {
  return (
    !isMinor(p.age_range) &&
    (p.experience ?? "beginner") !== "beginner" &&
    p.activity_level !== "sedentary"
  );
}

function domainRotation(p: PlannerProfile): DomainId[] {
  const preferred = p.preferred_domains.filter(isDomainId);
  const goal =
    GOAL_DOMAINS[p.primary_goal ?? "general"] ?? (["strength", "cardio", "mobility"] as DomainId[]);
  const ordered = preferred.length
    ? [...goal.filter((d) => preferred.includes(d)), ...preferred]
    : goal;
  const blocked = new Set(activeLimitations(p.limitations).flatMap((r) => r.domains));
  const unique = Array.from(new Set(ordered)).filter((d) => !blocked.has(d));
  return unique.length ? unique : ["mobility", "cardio"];
}

export function selectExercises(
  catalogue: PlannerExercise[],
  domain: DomainId,
  p: PlannerProfile,
  count: number,
  seed: number,
): PlannerExercise[] {
  const owned = new Set([...ALWAYS_AVAILABLE, ...p.equipment]);
  const level = LEVEL[p.experience ?? "beginner"];
  const blockedPatterns = new Set(activeLimitations(p.limitations).flatMap((r) => r.patterns));
  const high = allowHighIntensity(p);
  const pool = catalogue
    .filter((e) => e.domain === domain)
    .filter((e) => equipmentMatches(e.slug, e.equipment, owned))
    .filter((e) => LEVEL[e.difficulty] <= level)
    .filter((e) => high || !e.high_intensity)
    .filter((e) => !blockedPatterns.has(e.pattern))
    .sort((a, b) => a.slug.localeCompare(b.slug));
  if (pool.length === 0) return [];
  const out: PlannerExercise[] = [];
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    const pick = pool[(seed + i) % pool.length];
    if (pick) out.push(pick);
  }
  return out;
}

export function generatePlan(p: PlannerProfile, catalogue: PlannerExercise[]): GeneratedPlan {
  const days = trainingDayCount(p);
  const offsets = DAY_PATTERNS[days] ?? [0, 2, 4];
  const rotation = domainRotation(p);
  const minutes = Math.min(180, Math.max(10, p.session_minutes ?? 45));
  const perSession = minutes <= 20 ? 2 : minutes <= 40 ? 3 : 4;
  const high = allowHighIntensity(p);
  const limits = activeLimitations(p.limitations);

  const result: PlannedDay[] = [];
  let prevDemanding = false;
  let prevOffset = -2;
  offsets.forEach((offset, i) => {
    let domain = rotation[i % rotation.length] ?? "mobility";
    // Rule: last day of a 7-day week is always recovery.
    if (days === 7 && i === 6) domain = "recovery";
    // Rule: never schedule demanding domains on consecutive days.
    const consecutive = offset - prevOffset === 1;
    if (domainById(domain).demanding && prevDemanding && consecutive) domain = "mobility";

    let picks = selectExercises(catalogue, domain, p, perSession, i);
    if (picks.length === 0 && domain !== "recovery") {
      domain = "mobility";
      picks = selectExercises(catalogue, domain, p, perSession, i);
    }
    const calm = domain === "yoga" || domain === "recovery" || domain === "mobility";
    const demanding = domainById(domain).demanding;
    const intensity: Intensity = calm
      ? "low"
      : demanding && high && p.experience === "advanced"
        ? "high"
        : "moderate";

    result.push({
      dayOffset: offset,
      domain,
      title: `${domainById(domain).short} · ${calm ? "Restore" : i % 2 === 0 ? "Build" : "Develop"}`,
      focus:
        picks
          .map((e) => e.pattern)
          .filter((v, j, a) => a.indexOf(v) === j)
          .join(", ") || domain,
      duration_min: minutes,
      intensity,
      blocks: {
        warmup: WARMUPS[calm ? "calm" : "active"],
        main: picks.map((e) => ({
          slug: e.slug,
          name: e.name,
          prescription: e.prescription,
          cues: e.cues,
        })),
        cooldown: COOLDOWNS[calm ? "calm" : "active"],
      },
    });
    prevDemanding = demanding;
    prevOffset = offset;
  });

  const goalLabel = p.primary_goal ?? "general";
  const rationale = [
    `${days} training day${days > 1 ? "s" : ""} scheduled${days < (p.days_per_week ?? days) ? ` (reduced from ${p.days_per_week} requested to protect recovery for your current level)` : ""}, spread to leave rest between sessions.`,
    `Domains prioritised for your "${goalLabel}" goal${p.preferred_domains.length ? " and your preferred domains" : ""}: ${rotation
      .slice(0, 4)
      .map((d) => domainById(d).short)
      .join(", ")}.`,
    `Exercises filtered to your equipment and ${p.experience ?? "beginner"} experience; sessions sized for ${minutes} minutes (${perSession} main exercises).`,
    "Demanding domains (sprint, plyometrics, combat) are never placed on back-to-back days.",
  ];
  const safety = [
    "This plan is general fitness guidance, not medical care. Seek qualified advice for any health concern, pain or injury.",
    "Stop any exercise that causes sharp pain, dizziness or chest discomfort.",
  ];
  if (!high)
    safety.push(
      "High-intensity drills are excluded at your current level; they unlock as experience and activity increase.",
    );
  if (isMinor(p.age_range))
    safety.push(
      "Under-18 profile: conservative volume, no maximal or high-intensity work. Train with a qualified coach or adult supervision.",
    );
  if (limits.length)
    safety.push(
      `Movements adjusted for noted ${limits.map((l) => l.label).join(", ")} limitation(s). Confirm suitability with a qualified professional.`,
    );
  return { rationale, safety_notes: safety, days: result };
}
