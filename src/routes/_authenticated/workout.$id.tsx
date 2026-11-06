import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, SkipForward, CheckCircle2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader, Panel, DomainBadge, IntensityPill, Loading, ErrorState, Disclaimer } from "@/components/ui-kit";
import type { PlannedWorkout } from "@/lib/data";
import type { BlockItem } from "@/lib/planner";

export const Route = createFileRoute("/_authenticated/workout/$id")({
  head: () => ({ meta: [{ title: "Workout Session — Human Performance AI" }, { name: "description", content: "Guided workout with set logging." }] }),
  component: WorkoutPage,
});

interface SetRow { reps: string; load: string; seconds: string; distance: string }
const emptySet = (): SetRow => ({ reps: "", load: "", seconds: "", distance: "" });
const num = (s: string) => (s.trim() === "" ? null : Number(s));

function WorkoutPage() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["workout", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("planned_workouts").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as unknown as PlannedWorkout | null;
    },
  });
  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data) return <ErrorState error={new Error("Workout not found")} />;
  return <Session w={q.data} />;
}

function BlockList({ title, items }: { title: string; items: BlockItem[] }) {
  return (
    <Panel title={title}>
      <ul className="space-y-3">
        {items.map((it, i) => (
          <li key={i} className="flex items-start justify-between gap-3 text-sm">
            <div><p className="font-medium">{it.name}</p><p className="text-xs text-muted-foreground">{it.cues.join(" · ")}</p></div>
            <span className="stat-num shrink-0 text-xs text-muted-foreground">{it.prescription}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Session({ w }: { w: PlannedWorkout }) {
  const [sets, setSets] = useState<Record<number, SetRow[]>>(() => Object.fromEntries(w.blocks.main.map((_, i) => [i, [emptySet()]])));
  const [duration, setDuration] = useState(String(w.duration_min));
  const [rpe, setRpe] = useState("6");
  const [notes, setNotes] = useState("");
  const [modified, setModified] = useState(false);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const locked = w.status !== "planned";

  const updateSet = (ex: number, i: number, k: keyof SetRow, v: string) =>
    setSets((s) => ({ ...s, [ex]: s[ex].map((r, j) => (j === i ? { ...r, [k]: v } : r)) }));

  async function finish(status: "completed" | "skipped" | "modified") {
    const d = Number(duration);
    const r = Number(rpe);
    if (status !== "skipped" && (!Number.isFinite(d) || d < 1 || d > 600)) return toast.error("Duration must be 1–600 minutes");
    if (status !== "skipped" && (r < 1 || r > 10)) return toast.error("RPE must be 1–10");
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const user_id = u.user!.id;
      const { data: session, error } = await supabase.from("workout_sessions").insert({
        user_id, planned_workout_id: w.id, domain: w.domain, title: w.title, status,
        duration_min: status === "skipped" ? 0 : d, rpe: status === "skipped" ? null : r, notes: notes.trim() || null,
      }).select().single();
      if (error) throw error;
      if (status !== "skipped") {
        const rows = w.blocks.main.flatMap((ex, ei) => (sets[ei] ?? [])
          .filter((s) => s.reps || s.load || s.seconds || s.distance)
          .map((s, si) => ({ session_id: session.id, user_id, exercise_name: ex.name, set_number: si + 1, reps: num(s.reps), load_kg: num(s.load), seconds: num(s.seconds), distance_m: num(s.distance) })));
        if (rows.length) { const { error: se } = await supabase.from("set_logs").insert(rows); if (se) throw se; }
      }
      const { error: ue } = await supabase.from("planned_workouts").update({ status: status === "skipped" ? "skipped" : "completed" }).eq("id", w.id);
      if (ue) throw ue;
      await qc.invalidateQueries();
      toast.success(status === "skipped" ? "Session skipped" : "Session logged");
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save session");
    } finally { setBusy(false); }
  }

  return (
    <>
      <Link to="/plan" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Plan</Link>
      <PageHeader eyebrow={format(parseISO(w.scheduled_date), "EEEE d MMMM")} title={w.title}
        description={`${w.duration_min} min · focus: ${w.focus}`}
        action={<div className="flex items-center gap-3"><DomainBadge domain={w.domain} /><IntensityPill level={w.intensity} /></div>} />
      {locked && <div className="mb-4 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">This session is marked <strong>{w.status}</strong>. You can still review it below.</div>}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <BlockList title="Warm-up" items={w.blocks.warmup} />
          <Panel title="Main work">
            <div className="space-y-6">
              {w.blocks.main.map((ex, ei) => (
                <div key={ei} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{ex.name}</p>
                      <p className="stat-num text-xs text-primary">{ex.prescription}</p>
                    </div>
                    {ex.slug && <Link to="/library/$slug" params={{ slug: ex.slug }} className="text-xs text-muted-foreground hover:text-foreground">Details →</Link>}
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">{ex.cues.map((c) => <li key={c}>· {c}</li>)}</ul>
                  {!locked && (
                    <div className="mt-4 space-y-2">
                      <div className="grid grid-cols-[2rem_repeat(4,1fr)_2rem] gap-2 text-[10px] uppercase text-muted-foreground">
                        <span>Set</span><span>Reps</span><span>Kg</span><span>Sec</span><span>Metres</span><span />
                      </div>
                      {(sets[ei] ?? []).map((s, si) => (
                        <div key={si} className="grid grid-cols-[2rem_repeat(4,1fr)_2rem] items-center gap-2">
                          <span className="stat-num text-sm text-muted-foreground">{si + 1}</span>
                          {(["reps", "load", "seconds", "distance"] as const).map((k) => (
                            <Input key={k} type="number" min={0} inputMode="decimal" aria-label={`${ex.name} set ${si + 1} ${k}`} className="h-8" value={s[k]} onChange={(e) => updateSet(ei, si, k, e.target.value)} />
                          ))}
                          <button type="button" aria-label="Remove set" className="text-muted-foreground hover:text-destructive" onClick={() => setSets((st) => ({ ...st, [ei]: st[ei].filter((_, j) => j !== si) }))}><Trash2 className="size-4" /></button>
                        </div>
                      ))}
                      <Button type="button" size="sm" variant="ghost" onClick={() => setSets((st) => ({ ...st, [ei]: [...(st[ei] ?? []), emptySet()] }))}><Plus />Add set</Button>
                    </div>
                  )}
                </div>
              ))}
              {w.blocks.main.length === 0 && <p className="text-sm text-muted-foreground">No exercises matched — follow the warm-up and cooldown as a recovery session.</p>}
            </div>
          </Panel>
          <BlockList title="Cooldown" items={w.blocks.cooldown} />
        </div>

        {!locked && (
          <div className="space-y-4">
            <Panel title="Finish session" className="lg:sticky lg:top-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label htmlFor="dur">Duration (min)</Label><Input id="dur" type="number" min={1} max={600} value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label htmlFor="rpe">Session RPE (1–10)</Label><Input id="rpe" type="number" min={1} max={10} value={rpe} onChange={(e) => setRpe(e.target.value)} /></div>
                </div>
                <div className="space-y-1.5"><Label htmlFor="notes">Notes</Label><Textarea id="notes" maxLength={2000} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did it feel?" /></div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={modified} onChange={(e) => setModified(e.target.checked)} className="accent-primary" />I modified this session</label>
                <Button variant="hero" className="w-full" disabled={busy} onClick={() => finish(modified ? "modified" : "completed")}><CheckCircle2 />{busy ? "Saving…" : "Complete & log"}</Button>
                <Button variant="outline" className="w-full" disabled={busy} onClick={() => finish("skipped")}><SkipForward />Skip session</Button>
              </div>
            </Panel>
            <Disclaimer />
          </div>
        )}
      </div>
    </>
  );
}
