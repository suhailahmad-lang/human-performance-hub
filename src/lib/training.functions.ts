import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { completionSchema } from "./training-logic";
import { generatePlan, type PlannerExercise } from "./planner";
import { z } from "zod";

export const finishWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(completionSchema)
  .handler(async ({ data, context }) => {
    const { data: id, error } = await context.supabase.rpc("finish_workout", {
      p_workout: data.workoutId,
      p_status: data.status,
      p_duration: data.duration,
      p_rpe: data.rpe ?? 1,
      p_notes: data.notes ?? "",
      p_date: data.date,
      p_sets: data.sets,
    });
    if (error) throw new Error(error.message);
    return id;
  });

export const replacePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
  .handler(async ({ data, context }) => {
    const { data: profile, error: pe } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .single();
    if (pe) throw new Error(pe.message);
    const { data: exercises, error: ee } = await context.supabase.from("exercises").select("*");
    if (ee) throw new Error(ee.message);
    const catalogue: PlannerExercise[] = (exercises ?? []).map((e) => ({
      ...e,
      difficulty:
        e.difficulty === "advanced"
          ? "advanced"
          : e.difficulty === "intermediate"
            ? "intermediate"
            : "beginner",
    }));
    const plan = generatePlan(
      {
        ...profile,
        experience:
          profile.experience === "advanced"
            ? "advanced"
            : profile.experience === "intermediate"
              ? "intermediate"
              : "beginner",
      },
      catalogue,
    );
    const { data: id, error } = await context.supabase.rpc("replace_training_plan", {
      p_start: data.start,
      p_rationale: plan.rationale,
      p_safety: plan.safety_notes,
      p_days: plan.days.map((day) => ({
        ...day,
        blocks: {
          ...day.blocks,
          warmup: day.blocks.warmup.map((i) => ({ ...i })),
          main: day.blocks.main.map((i) => ({ ...i })),
          cooldown: day.blocks.cooldown.map((i) => ({ ...i })),
        },
      })),
    });
    if (error) throw new Error(error.message);
    return id;
  });
