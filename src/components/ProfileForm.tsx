import { useState, type ReactNode } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { ACTIVITY_LEVELS, AGE_RANGES, DOMAINS, EQUIPMENT, GOALS } from "@/lib/domains";
import type { Profile } from "@/lib/data";
import { cn } from "@/lib/utils";

export type ProfileInput = Pick<Profile,
  "display_name" | "age_range" | "height_cm" | "weight_kg" | "gender" | "experience" | "primary_goal" |
  "secondary_goals" | "days_per_week" | "session_minutes" | "equipment" | "location" | "preferred_domains" |
  "activity_level" | "limitations">;

const schema = z.object({
  display_name: z.string().trim().min(1, "Display name is required").max(60),
  age_range: z.string().min(1, "Select an age range"),
  experience: z.enum(["beginner", "intermediate", "advanced"], { message: "Select your experience" }),
  primary_goal: z.string().min(1, "Select a primary goal"),
  activity_level: z.string().min(1, "Select your activity level"),
  days_per_week: z.number().int().min(1).max(7),
  session_minutes: z.number().int().min(10).max(180),
  height_cm: z.number().min(80).max(250).nullable(),
  weight_kg: z.number().min(20).max(350).nullable(),
  limitations: z.string().max(500).nullable(),
});

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick}
      className={cn("rounded-full border px-3 py-1.5 text-sm transition-colors",
        active ? "border-primary bg-primary/15 text-primary" : "border-border bg-secondary text-secondary-foreground hover:border-muted-foreground")}>
      {children}
    </button>
  );
}

function Field({ label, optional, children, hint }: { label: string; optional?: boolean; children: ReactNode; hint?: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label} {optional && <span className="font-normal text-muted-foreground">(optional)</span>}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export function ProfileForm({ initial, submitLabel, onSubmit }: { initial: Partial<ProfileInput>; submitLabel: string; onSubmit: (v: ProfileInput) => Promise<void> }) {
  const [v, setV] = useState<ProfileInput>({
    display_name: initial.display_name ?? "", age_range: initial.age_range ?? null, height_cm: initial.height_cm ?? null,
    weight_kg: initial.weight_kg ?? null, gender: initial.gender ?? null, experience: initial.experience ?? null,
    primary_goal: initial.primary_goal ?? null, secondary_goals: initial.secondary_goals ?? [], days_per_week: initial.days_per_week ?? 3,
    session_minutes: initial.session_minutes ?? 45, equipment: initial.equipment ?? [], location: initial.location ?? "home",
    preferred_domains: initial.preferred_domains ?? [], activity_level: initial.activity_level ?? null, limitations: initial.limitations ?? "",
  });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof ProfileInput>(k: K, val: ProfileInput[K]) => setV((s) => ({ ...s, [k]: val }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = schema.safeParse({ ...v, limitations: v.limitations || null });
    if (!r.success) return toast.error(r.error.issues[0].message);
    setBusy(true);
    try { await onSubmit({ ...v, limitations: v.limitations?.trim() || null, gender: v.gender || null }); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Could not save"); }
    finally { setBusy(false); }
  }

  const sectionCls = "space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6";

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className={sectionCls}>
        <p className="eyebrow">01 · About you</p>
        <Field label="Display name"><Input value={v.display_name ?? ""} onChange={(e) => set("display_name", e.target.value)} maxLength={60} /></Field>
        <Field label="Age range" hint="Under-18 profiles get conservative, supervised-friendly plans.">
          <div className="flex flex-wrap gap-2">{AGE_RANGES.map((a) => <Chip key={a} active={v.age_range === a} onClick={() => set("age_range", a)}>{a}</Chip>)}</div>
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Height (cm)" optional><Input type="number" inputMode="decimal" value={v.height_cm ?? ""} onChange={(e) => set("height_cm", e.target.value ? Number(e.target.value) : null)} /></Field>
          <Field label="Weight (kg)" optional><Input type="number" inputMode="decimal" value={v.weight_kg ?? ""} onChange={(e) => set("weight_kg", e.target.value ? Number(e.target.value) : null)} /></Field>
          <Field label="Gender" optional><Input value={v.gender ?? ""} onChange={(e) => set("gender", e.target.value)} maxLength={40} placeholder="Prefer not to say" /></Field>
        </div>
      </section>

      <section className={sectionCls}>
        <p className="eyebrow">02 · Baseline</p>
        <Field label="Experience level">
          <div className="flex flex-wrap gap-2">{(["beginner", "intermediate", "advanced"] as const).map((x) => <Chip key={x} active={v.experience === x} onClick={() => set("experience", x)}><span className="capitalize">{x}</span></Chip>)}</div>
        </Field>
        <Field label="Current activity level">
          <div className="flex flex-wrap gap-2">{ACTIVITY_LEVELS.map((x) => <Chip key={x.id} active={v.activity_level === x.id} onClick={() => set("activity_level", x.id)}>{x.label}</Chip>)}</div>
        </Field>
        <Field label="Limitations or movements to avoid" optional hint="e.g. 'knee discomfort when jumping'. Keywords like knee, back, shoulder, ankle or wrist adjust exercise selection.">
          <Textarea value={v.limitations ?? ""} onChange={(e) => set("limitations", e.target.value)} maxLength={500} rows={2} />
        </Field>
      </section>

      <section className={sectionCls}>
        <p className="eyebrow">03 · Goals</p>
        <Field label="Primary goal">
          <div className="flex flex-wrap gap-2">{GOALS.map((g) => <Chip key={g.id} active={v.primary_goal === g.id} onClick={() => set("primary_goal", g.id)}>{g.label}</Chip>)}</div>
        </Field>
        <Field label="Secondary goals" optional>
          <div className="flex flex-wrap gap-2">{GOALS.filter((g) => g.id !== v.primary_goal).map((g) => <Chip key={g.id} active={v.secondary_goals.includes(g.id)} onClick={() => set("secondary_goals", toggle(v.secondary_goals, g.id))}>{g.label}</Chip>)}</div>
        </Field>
        <Field label="Preferred domains" optional hint="Leave empty to let your goal decide.">
          <div className="flex flex-wrap gap-2">{DOMAINS.map((d) => <Chip key={d.id} active={v.preferred_domains.includes(d.id)} onClick={() => set("preferred_domains", toggle(v.preferred_domains, d.id))}>{d.short}</Chip>)}</div>
        </Field>
      </section>

      <section className={sectionCls}>
        <p className="eyebrow">04 · Schedule & setup</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={`Training days per week: ${v.days_per_week}`}>
            <input type="range" min={1} max={7} value={v.days_per_week ?? 3} onChange={(e) => set("days_per_week", Number(e.target.value))} className="w-full accent-primary" aria-label="Training days per week" />
          </Field>
          <Field label={`Session length: ${v.session_minutes} min`}>
            <input type="range" min={15} max={120} step={5} value={v.session_minutes ?? 45} onChange={(e) => set("session_minutes", Number(e.target.value))} className="w-full accent-primary" aria-label="Session length" />
          </Field>
        </div>
        <Field label="Training location">
          <div className="flex flex-wrap gap-2">{["home", "gym", "outdoors", "mixed"].map((l) => <Chip key={l} active={v.location === l} onClick={() => set("location", l)}><span className="capitalize">{l}</span></Chip>)}</div>
        </Field>
        <Field label="Available equipment" optional hint="Bodyweight exercises are always included.">
          <div className="flex flex-wrap gap-2">{EQUIPMENT.map((e) => <Chip key={e.id} active={v.equipment.includes(e.id)} onClick={() => set("equipment", toggle(v.equipment, e.id))}>{e.label}</Chip>)}</div>
        </Field>
      </section>

      <Button type="submit" variant="hero" size="lg" className="w-full sm:w-auto" disabled={busy}>{busy ? "Saving…" : submitLabel}</Button>
    </form>
  );
}
