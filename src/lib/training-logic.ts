import { format, subDays } from "date-fns";
import { z } from "zod";

export const completionSchema = z
  .object({
    workoutId: z.string().uuid(),
    status: z.enum(["completed", "modified", "skipped"]),
    duration: z.number().int().min(0).max(600),
    rpe: z.number().int().min(1).max(10).nullable(),
    notes: z.string().max(2000).nullable(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sets: z.array(
      z.object({
        exercise_name: z.string().min(1),
        set_number: z.number().int().min(1).max(50),
        reps: z.number().int().min(0).max(1000).nullable(),
        load_kg: z.number().finite().min(0).max(1000).nullable(),
        seconds: z.number().int().min(0).max(36000).nullable(),
        distance_m: z.number().finite().min(0).max(200000).nullable(),
      }),
    ),
  })
  .superRefine((v, ctx) => {
    if (v.status !== "skipped" && (v.duration < 1 || v.rpe === null)) {
      ctx.addIssue({ code: "custom", message: "Duration must be 1–600 minutes and RPE 1–10" });
    }
  });

export const rangeStart = (days: number, now = new Date()) =>
  format(subDays(now, days - 1), "yyyy-MM-dd");

export function sessionSummary<
  T extends { status: string; duration_min: number; rpe: number | null },
>(sessions: T[]) {
  const done = sessions.filter((s) => s.status === "completed" || s.status === "modified");
  const rpes = done.flatMap((s) => (s.rpe === null ? [] : [s.rpe]));
  return {
    done,
    skipped: sessions.filter((s) => s.status === "skipped").length,
    minutes: done.reduce((a, s) => a + s.duration_min, 0),
    avgRpe: rpes.length ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : "—",
  };
}
