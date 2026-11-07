/**
 * AI Coach provider abstraction. Today only the rule-based demo provider exists;
 * a future live provider (e.g. a server function calling an AI model) can
 * implement the same interface without changing the UI.
 */
export interface CoachContext {
  displayName?: string | null;
  goal?: string | null;
  experience?: string | null;
  isMinor?: boolean;
}

export interface CoachReply {
  text: string;
  source: "demo-rules" | "live-ai";
}

export interface CoachProvider {
  id: string;
  live: boolean;
  reply(message: string, ctx: CoachContext): Promise<CoachReply>;
}

export const COACH_TOPICS = [
  { id: "soreness", label: "I'm sore today — should I train?" },
  { id: "missed", label: "I missed sessions this week" },
  { id: "warmup", label: "How should I warm up?" },
  { id: "progress", label: "How do I progress safely?" },
  { id: "sleep", label: "Tips for better recovery" },
  { id: "rpe", label: "What is RPE?" },
] as const;

const RULES: { id: string; keywords: string[]; answer: (c: CoachContext) => string }[] = [
  {
    id: "soreness",
    keywords: ["sore", "doms", "ache", "tired"],
    answer: () =>
      "Mild muscle soreness is normal after new training. Consider swapping today for a lighter session — a mobility flow, easy walk or the Recovery domain — and keep effort around RPE 4–5. If you notice sharp, localised or worsening pain, swelling, or pain that changes how you move, pause that movement and speak with a qualified health professional.",
  },
  {
    id: "missed",
    keywords: ["missed", "skip", "behind", "busy"],
    answer: () =>
      "No need to make up missed sessions by doubling up. Resume from today's planned session. If you missed more than a week, reduce load or volume by roughly 20–30% for your first session back. Consistency over weeks matters far more than any single workout.",
  },
  {
    id: "warmup",
    keywords: ["warm", "warmup", "warm-up", "prepare"],
    answer: () =>
      "A good warm-up: 3–5 minutes of easy cardio to raise temperature, 2–3 dynamic mobility drills for the joints you'll use, then 1–2 lighter rehearsal sets of your first exercise. Every planned session in your plan already includes one.",
  },
  {
    id: "progress",
    keywords: ["progress", "heavier", "increase", "plateau", "harder"],
    answer: (c) =>
      `Progress one variable at a time: add a rep, then a set, then a small load increase (~2.5–5%). When all prescribed reps feel like RPE 7 or easier for two sessions, progress.${c.isMinor ? " At your age, prioritise technique and bodyweight skill over load, ideally with a qualified coach." : ""}`,
  },
  {
    id: "sleep",
    keywords: ["sleep", "recover", "recovery", "rest", "stress"],
    answer: () =>
      "Recovery basics: consistent sleep and wake times, regular meals, hydration, and at least one easy or rest day between demanding sessions. Short breathing practices like Box Breathing (in the Recovery domain) can help you downshift after training.",
  },
  {
    id: "rpe",
    keywords: ["rpe", "effort", "intensity", "how hard"],
    answer: () =>
      "RPE (Rate of Perceived Exertion) is a 1–10 effort scale. 1–3 is very easy, 5–6 is moderate, 7–8 is hard with a couple of reps left in reserve, 9–10 is maximal. Logging RPE helps the planner and you judge readiness.",
  },
];

const MEDICAL = [
  "chest pain",
  "dizzy",
  "faint",
  "injury",
  "injured",
  "diagnos",
  "medication",
  "pregnan",
  "heart",
  "surgery",
];

export const demoCoach: CoachProvider = {
  id: "demo-rules",
  live: false,
  async reply(message, ctx) {
    const m = message.toLowerCase();
    if (MEDICAL.some((k) => m.includes(k))) {
      return {
        source: "demo-rules",
        text: "That sounds like a health question I can't safely answer. Human Performance AI provides general fitness guidance only and does not diagnose or treat conditions. Please speak with a doctor or qualified health professional. If you have chest pain, fainting or severe symptoms, seek urgent medical care.",
      };
    }
    const rule =
      RULES.find((r) => r.id === message) ??
      RULES.find((r) => r.keywords.some((k) => m.includes(k)));
    if (rule) return { source: "demo-rules", text: rule.answer(ctx) };
    return {
      source: "demo-rules",
      text: "I'm the demo coach, so I can only answer a set of common training topics right now — try one of the suggested questions. A live AI coach connection is planned for a future release.",
    };
  },
};
