import {
  Dumbbell,
  PersonStanding,
  Zap,
  Timer,
  Shield,
  Move,
  ArrowUpFromLine,
  HeartPulse,
  Flower2,
  Moon,
  type LucideIcon,
} from "lucide-react";

export type DomainId =
  | "strength"
  | "calisthenics"
  | "sprint"
  | "endurance"
  | "combat"
  | "mobility"
  | "plyometrics"
  | "cardio"
  | "yoga"
  | "recovery";

export interface Domain {
  id: DomainId;
  name: string;
  short: string;
  icon: LucideIcon;
  description: string;
  /** Sessions in this domain are taxing on the nervous system / joints. */
  demanding: boolean;
}

export const DOMAINS: Domain[] = [
  { id: "strength", name: "Strength Training", short: "Strength", icon: Dumbbell, demanding: false, description: "Loaded lifts to build force production and resilient tissue." },
  { id: "calisthenics", name: "Calisthenics", short: "Calisthenics", icon: PersonStanding, demanding: false, description: "Bodyweight strength and control, progressed by leverage." },
  { id: "sprint", name: "Sprint Training", short: "Sprint", icon: Zap, demanding: true, description: "Acceleration and top-speed mechanics with full recovery." },
  { id: "endurance", name: "Endurance Training", short: "Endurance", icon: Timer, demanding: false, description: "Aerobic base and sustained effort for long-duration work." },
  { id: "combat", name: "Martial Arts / Combat Fitness", short: "Combat", icon: Shield, demanding: true, description: "Footwork, striking-pad and bag conditioning for skill fitness." },
  { id: "mobility", name: "Mobility Training", short: "Mobility", icon: Move, demanding: false, description: "Joint range and control to move well and train longer." },
  { id: "plyometrics", name: "Plyometrics", short: "Plyo", icon: ArrowUpFromLine, demanding: true, description: "Jumps and bounds for elastic power and landing skill." },
  { id: "cardio", name: "Cardio", short: "Cardio", icon: HeartPulse, demanding: false, description: "Heart-rate work for fitness, health and work capacity." },
  { id: "yoga", name: "Yoga & Pranayama", short: "Yoga", icon: Flower2, demanding: false, description: "Breath-led movement practice for balance and calm." },
  { id: "recovery", name: "Meditation / Recovery", short: "Recovery", icon: Moon, demanding: false, description: "Downshift, breathe and recover between hard days." },
];

export const domainById = (id: string): Domain =>
  DOMAINS.find((d) => d.id === id) ?? DOMAINS[0];

export const GOALS = [
  { id: "strength", label: "Get stronger" },
  { id: "endurance", label: "Build endurance" },
  { id: "speed", label: "Speed & power" },
  { id: "general", label: "General fitness" },
  { id: "combat", label: "Combat conditioning" },
  { id: "wellbeing", label: "Mobility & wellbeing" },
] as const;

export const EQUIPMENT = [
  { id: "dumbbell", label: "Dumbbells" },
  { id: "kettlebell", label: "Kettlebell" },
  { id: "barbell", label: "Barbell" },
  { id: "rack", label: "Squat rack" },
  { id: "bench", label: "Bench" },
  { id: "pullup_bar", label: "Pull-up bar" },
  { id: "rings", label: "Rings" },
  { id: "box", label: "Plyo box" },
  { id: "jump_rope", label: "Jump rope" },
  { id: "bike", label: "Bike" },
  { id: "rower", label: "Rower" },
  { id: "heavy_bag", label: "Heavy bag" },
  { id: "agility_ladder", label: "Agility ladder" },
  { id: "foam_roller", label: "Foam roller" },
  { id: "track", label: "Track / open field" },
] as const;

/** Equipment everyone is assumed to have. */
export const ALWAYS_AVAILABLE = ["none", "mat"];

export const AGE_RANGES = ["under-18", "18-29", "30-39", "40-49", "50-59", "60+"] as const;
export const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Mostly sedentary" },
  { id: "light", label: "Lightly active (1–2 days/week)" },
  { id: "moderate", label: "Moderately active (3–4 days/week)" },
  { id: "high", label: "Very active (5+ days/week)" },
] as const;
