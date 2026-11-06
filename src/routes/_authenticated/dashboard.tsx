import { createFileRoute, Link } from "@tanstack/react-router";
import { format, parseISO, subDays } from "date-fns";
import { ArrowRight, CheckCircle2, Clock, Flame, Target } from "lucide-react";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Stat, DomainBadge, IntensityPill, Loading, ErrorState, Empty } from "@/components/ui-kit";
import { todayISO, useActivePlan, useProfile, useSessions } from "@/lib/data";
import { domainById, GOALS } from "@/lib/domains";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Human Performance AI" }, { name: "description", content: "Today's session, weekly schedule and training stats." }] }),
  component: Dashboard,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Dashboard() {
  const profile = useProfile();
  const plan = useActivePlan();
  const since = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const sessions = useSessions(since);

  if (profile.isLoading || plan.isLoading || sessions.isLoading) return <Loading />;
  if (plan.error || sessions.error) return <ErrorState error={plan.error ?? sessions.error} onRetry={() => { plan.refetch(); sessions.refetch(); }} />;

  const today = todayISO();
  const workouts = plan.data?.workouts ?? [];
  const todays = workouts.find((w) => w.scheduled_date === today);
  const nextUp = workouts.find((w) => w.scheduled_date >= today && w.status === "planned");
  const due = workouts.filter((w) => w.scheduled_date <= today);
  const done = workouts.filter((w) => w.status === "completed");
  const consistency = due.length ? Math.round((due.filter((w) => w.status === "completed").length / due.length) * 100) : 0;
  const completed = (sessions.data ?? []).filter((s) => s.status !== "skipped");
  const minutes = completed.reduce((a, s) => a + s.duration_min, 0);
  const dist = Object.entries(completed.reduce<Record<string, number>>((a, s) => ({ ...a, [s.domain]: (a[s.domain] ?? 0) + s.duration_min }), {}))
    .map(([d, m]) => ({ name: domainById(d).short, value: m }));
  const goal = GOALS.find((g) => g.id === profile.data?.primary_goal)?.label;

  return (
    <>
      <PageHeader eyebrow={format(new Date(), "EEEE, d MMMM")} title={`Hello, ${profile.data?.display_name ?? "athlete"}`}
        description={goal ? `Primary goal: ${goal}` : undefined} />

      {!plan.data ? (
        <Empty title="No active plan" action={<Button asChild><Link to="/settings">Generate a plan</Link></Button>}>Generate a plan from your profile to start training.</Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel className="bg-hero lg:col-span-2">
            <p className="eyebrow">Today's session</p>
            {todays ? (
              <div className="mt-3">
                <div className="flex flex-wrap items-center gap-3"><DomainBadge domain={todays.domain} /><IntensityPill level={todays.intensity} /><span className="stat-num text-xs text-muted-foreground">{todays.duration_min} MIN</span></div>
                <h2 className="mt-3 text-3xl font-bold">{todays.title}</h2>
                <p className="mt-1 text-sm capitalize text-muted-foreground">Focus: {todays.focus}</p>
                <div className="mt-5">
                  {todays.status === "planned" ? (
                    <Button variant="hero" asChild><Link to="/workout/$id" params={{ id: todays.id }}>Start session <ArrowRight /></Link></Button>
                  ) : (
                    <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-primary" />Session {todays.status}. Nice work.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <h2 className="text-2xl font-bold">Rest & recover</h2>
                <p className="mt-1 text-sm text-muted-foreground">No session planned today. A walk or short breathing practice supports recovery.</p>
              </div>
            )}
          </Panel>

          <Panel title="Next recommended action">
            {nextUp && nextUp.scheduled_date !== today ? (
              <p className="text-sm">Next up: <strong>{nextUp.title}</strong> on {format(parseISO(nextUp.scheduled_date), "EEEE")}. Prepare by sleeping well and reviewing the cues.</p>
            ) : todays?.status === "planned" ? (
              <p className="text-sm">Complete today's {domainById(todays.domain).short.toLowerCase()} session and log your RPE.</p>
            ) : (
              <p className="text-sm">Your week is wrapped up. Regenerate your plan in Settings to start a new week.</p>
            )}
            <Button variant="link" className="mt-2 px-0" asChild><Link to="/coach">Ask the coach</Link></Button>
          </Panel>

          <div className="grid grid-cols-2 gap-4 lg:col-span-3 lg:grid-cols-4">
            <Stat label="Consistency" value={`${consistency}%`} hint="Completed vs. due this plan" />
            <Stat label="Completed" value={`${done.length}/${workouts.length}`} hint="Sessions this plan" />
            <Stat label="Minutes" value={minutes} hint="Last 30 days" />
            <Stat label="Sessions" value={completed.length} hint="Last 30 days" />
          </div>

          <Panel title="This week" className="lg:col-span-2">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(parseISO(plan.data!.plan.week_start)); d.setDate(d.getDate() + i);
                const iso = format(d, "yyyy-MM-dd");
                const w = workouts.find((x) => x.scheduled_date === iso);
                const Icon = w ? domainById(w.domain).icon : null;
                return (
                  <div key={iso} className={cn("flex flex-col items-center gap-2 rounded-lg border p-2 text-center", iso === today ? "border-primary" : "border-border")}>
                    <span className="stat-num text-[10px] text-muted-foreground">{format(d, "EEE").toUpperCase()}</span>
                    {Icon ? <Icon className={cn("size-5", w!.status === "completed" ? "text-primary" : w!.status === "skipped" ? "text-muted-foreground/40" : "text-foreground")} /> : <span className="size-5 text-muted-foreground">·</span>}
                    <span className="text-[10px] text-muted-foreground">{w ? w.status : "rest"}</span>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Domain distribution">
            {dist.length ? (
              <div className="h-44">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={dist} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} stroke="none">
                      {dist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={(v) => `${v} min`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-sm text-muted-foreground">Complete a session to see where your training time goes.</p>}
          </Panel>

          <Panel title="Recent activity" className="lg:col-span-3">
            {completed.length || sessions.data?.length ? (
              <ul className="divide-y divide-border">
                {(sessions.data ?? []).slice(0, 5).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="flex items-center gap-3"><DomainBadge domain={s.domain} /><span className="font-medium">{s.title}</span></div>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span className="hidden items-center gap-1 sm:flex"><Clock className="size-3.5" />{s.duration_min}m</span>
                      {s.rpe && <span className="hidden items-center gap-1 sm:flex"><Flame className="size-3.5" />RPE {s.rpe}</span>}
                      <span className="flex items-center gap-1"><Target className="size-3.5" />{s.status}</span>
                      <span className="stat-num text-xs">{format(parseISO(s.performed_on), "d MMM")}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No sessions logged yet.</p>}
          </Panel>
        </div>
      )}
    </>
  );
}
