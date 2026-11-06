import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO, startOfWeek, subDays } from "date-fns";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Stat, Loading, ErrorState } from "@/components/ui-kit";
import { todayISO, useProgressRecords, useSessions } from "@/lib/data";
import { domainById } from "@/lib/domains";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({ meta: [{ title: "Progress & Analytics — Human Performance AI" }, { name: "description", content: "Training volume, consistency, effort and wellbeing trends." }] }),
  component: Progress,
});

const RANGES = [{ d: 7, l: "7D" }, { d: 30, l: "30D" }, { d: 90, l: "90D" }];
const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 } };
const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false };

function Progress() {
  const [range, setRange] = useState(30);
  const since = format(subDays(new Date(), range), "yyyy-MM-dd");
  const sessions = useSessions(since);
  const records = useProgressRecords(since);

  return (
    <>
      <PageHeader eyebrow="Analytics" title="Progress" description="Measured by consistency, capability and wellbeing."
        action={<div role="group" aria-label="Date range" className="flex rounded-lg border border-border p-1">{RANGES.map((r) => (
          <button key={r.d} onClick={() => setRange(r.d)} aria-pressed={range === r.d} className={cn("stat-num rounded-md px-3 py-1 text-xs", range === r.d ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{r.l}</button>
        ))}</div>} />
      {sessions.isLoading ? <Loading /> : sessions.error ? <ErrorState error={sessions.error} onRetry={() => sessions.refetch()} /> : <Charts sessions={sessions.data ?? []} />}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <CheckIn />
        <Panel title="Wellbeing trend" className="lg:col-span-2">
          {records.data && records.data.length > 0 ? (
            <div className="h-56"><ResponsiveContainer><LineChart data={records.data.map((r) => ({ ...r, day: format(parseISO(r.recorded_on), "d MMM") }))}>
              <CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="day" {...axis} /><YAxis domain={[1, 5]} {...axis} width={20} /><Tooltip {...tip} />
              <Line dataKey="energy" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
              <Line dataKey="sleep_quality" name="sleep" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
              <Line dataKey="soreness" stroke="var(--chart-5)" strokeWidth={2} dot={false} />
            </LineChart></ResponsiveContainer></div>
          ) : <p className="text-sm text-muted-foreground">Log a daily check-in to see energy, sleep and soreness trends.</p>}
        </Panel>
      </div>
    </>
  );
}

function Charts({ sessions }: { sessions: { performed_on: string; duration_min: number; domain: string; rpe: number | null; status: string }[] }) {
  const done = sessions.filter((s) => s.status !== "skipped");
  const skipped = sessions.length - done.length;
  const minutes = done.reduce((a, s) => a + s.duration_min, 0);
  const rpes = done.filter((s) => s.rpe).map((s) => s.rpe!);
  const avgRpe = rpes.length ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : "—";
  const weekly = Object.entries(done.reduce<Record<string, number>>((a, s) => {
    const k = format(startOfWeek(parseISO(s.performed_on), { weekStartsOn: 1 }), "d MMM"); return { ...a, [k]: (a[k] ?? 0) + s.duration_min };
  }, {})).reverse().map(([week, min]) => ({ week, min }));
  const byDomain = Object.entries(done.reduce<Record<string, number>>((a, s) => ({ ...a, [s.domain]: (a[s.domain] ?? 0) + 1 }), {}))
    .map(([d, n]) => ({ domain: domainById(d).short, n })).sort((a, b) => b.n - a.n);
  const effort = [...done].reverse().filter((s) => s.rpe).map((s) => ({ day: format(parseISO(s.performed_on), "d MMM"), rpe: s.rpe }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="grid grid-cols-2 gap-4 lg:col-span-2 lg:grid-cols-4">
        <Stat label="Sessions" value={done.length} /><Stat label="Minutes" value={minutes} />
        <Stat label="Avg RPE" value={avgRpe} /><Stat label="Skipped" value={skipped} />
      </div>
      {done.length === 0 ? (
        <Panel className="lg:col-span-2"><p className="py-8 text-center text-sm text-muted-foreground">No completed sessions in this range yet. Complete a workout to populate your charts.</p></Panel>
      ) : (<>
        <Panel title="Weekly training minutes"><div className="h-56"><ResponsiveContainer><BarChart data={weekly}>
          <CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="week" {...axis} /><YAxis {...axis} width={30} /><Tooltip {...tip} cursor={{ fill: "var(--muted)" }} />
          <Bar dataKey="min" fill="var(--chart-1)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Panel>
        <Panel title="Sessions by domain"><div className="h-56"><ResponsiveContainer><BarChart data={byDomain} layout="vertical">
          <XAxis type="number" {...axis} allowDecimals={false} /><YAxis type="category" dataKey="domain" {...axis} width={80} /><Tooltip {...tip} cursor={{ fill: "var(--muted)" }} />
          <Bar dataKey="n" name="sessions" fill="var(--chart-2)" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></Panel>
        <Panel title="Session effort (RPE)" className="lg:col-span-2"><div className="h-48"><ResponsiveContainer><LineChart data={effort}>
          <CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="day" {...axis} /><YAxis domain={[0, 10]} {...axis} width={20} /><Tooltip {...tip} />
          <Line dataKey="rpe" stroke="var(--chart-4)" strokeWidth={2} /></LineChart></ResponsiveContainer></div></Panel>
      </>)}
    </div>
  );
}

function Scale({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div><p className="mb-1.5 text-sm">{label}</p><div role="radiogroup" aria-label={label} className="flex gap-1.5">{[1, 2, 3, 4, 5].map((n) => (
      <button key={n} role="radio" aria-checked={value === n} onClick={() => onChange(n)} className={cn("stat-num size-9 rounded-md border text-sm", value === n ? "border-primary bg-primary/15 text-primary" : "border-border")}>{n}</button>
    ))}</div></div>
  );
}

function CheckIn() {
  const [v, setV] = useState({ energy: 3, sleep_quality: 3, soreness: 2 });
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  async function save() {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("progress_records").upsert({ user_id: u.user!.id, recorded_on: todayISO(), ...v }, { onConflict: "user_id,recorded_on" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Check-in saved");
    qc.invalidateQueries({ queryKey: ["progress"] });
  }
  return (
    <Panel title="Daily check-in">
      <div className="space-y-4">
        <Scale label="Energy" value={v.energy} onChange={(n) => setV({ ...v, energy: n })} />
        <Scale label="Sleep quality" value={v.sleep_quality} onChange={(n) => setV({ ...v, sleep_quality: n })} />
        <Scale label="Soreness" value={v.soreness} onChange={(n) => setV({ ...v, soreness: n })} />
        <Button onClick={save} disabled={busy} className="w-full">{busy ? "Saving…" : "Save today's check-in"}</Button>
      </div>
    </Panel>
  );
}
