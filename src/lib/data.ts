import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { generatePlan, type PlannerExercise, type PlannerProfile, type WorkoutBlocks } from "./planner";
import { addDays, format } from "date-fns";

export type Profile = Tables<"profiles">;
export type Exercise = Tables<"exercises">;
export type PlannedWorkout = Omit<Tables<"planned_workouts">, "blocks"> & { blocks: WorkoutBlocks };
export type Plan = Tables<"training_plans">;
export type Session = Tables<"workout_sessions">;

export const todayISO = () => format(new Date(), "yyyy-MM-dd");

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const id = await uid();
      const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useExercises() {
  return useQuery({
    queryKey: ["exercises"],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("exercises").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useActivePlan() {
  return useQuery({
    queryKey: ["plan"],
    queryFn: async () => {
      const id = await uid();
      const { data: plan, error } = await supabase
        .from("training_plans").select("*").eq("user_id", id).eq("active", true)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      if (!plan) return null;
      const { data: workouts, error: e2 } = await supabase
        .from("planned_workouts").select("*").eq("plan_id", plan.id).order("scheduled_date");
      if (e2) throw e2;
      return { plan, workouts: (workouts ?? []) as unknown as PlannedWorkout[] };
    },
  });
}

export function useSessions(sinceISO?: string) {
  return useQuery({
    queryKey: ["sessions", sinceISO ?? "all"],
    queryFn: async () => {
      const id = await uid();
      let q = supabase.from("workout_sessions").select("*").eq("user_id", id).order("performed_on", { ascending: false });
      if (sinceISO) q = q.gte("performed_on", sinceISO);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useProgressRecords(sinceISO: string) {
  return useQuery({
    queryKey: ["progress", sinceISO],
    queryFn: async () => {
      const id = await uid();
      const { data, error } = await supabase.from("progress_records").select("*").eq("user_id", id)
        .gte("recorded_on", sinceISO).order("recorded_on");
      if (error) throw error;
      return data;
    },
  });
}

export function toPlannerProfile(p: Profile): PlannerProfile {
  return {
    age_range: p.age_range,
    experience: (p.experience as PlannerProfile["experience"]) ?? "beginner",
    primary_goal: p.primary_goal,
    days_per_week: p.days_per_week,
    session_minutes: p.session_minutes,
    equipment: p.equipment,
    preferred_domains: p.preferred_domains,
    activity_level: p.activity_level,
    limitations: p.limitations,
  };
}

/** Builds a fresh 7-day plan starting today and replaces the active plan. */
export async function createPlanFor(profile: Profile) {
  const id = await uid();
  const { data: exercises, error } = await supabase.from("exercises").select("*");
  if (error) throw error;
  const gen = generatePlan(toPlannerProfile(profile), exercises as PlannerExercise[]);
  const start = new Date();
  await supabase.from("training_plans").update({ active: false }).eq("user_id", id).eq("active", true);
  const { data: plan, error: pe } = await supabase.from("training_plans").insert({
    user_id: id, week_start: format(start, "yyyy-MM-dd"), rationale: gen.rationale, safety_notes: gen.safety_notes,
  }).select().single();
  if (pe) throw pe;
  const rows = gen.days.map((d) => ({
    plan_id: plan.id, user_id: id, scheduled_date: format(addDays(start, d.dayOffset), "yyyy-MM-dd"),
    domain: d.domain, title: d.title, focus: d.focus, duration_min: d.duration_min, intensity: d.intensity,
    blocks: d.blocks as unknown as never,
  }));
  const { error: we } = await supabase.from("planned_workouts").insert(rows);
  if (we) throw we;
  return plan;
}

export function useInvalidateAll() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}
