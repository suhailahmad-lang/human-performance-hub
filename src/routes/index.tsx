import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Gauge, CalendarCheck, Activity, LineChart, RefreshCw, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Disclaimer } from "@/components/ui-kit";
import { DOMAINS } from "@/lib/domains";
import hero from "@/assets/hero-athlete.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Human Performance AI — Measure, plan, train, adapt" },
      { name: "description", content: "Structured training plans across strength, speed, endurance, mobility and recovery. Log sessions and track real progress." },
      { property: "og:title", content: "Human Performance AI" },
      { property: "og:description", content: "Assess, get a structured plan, train daily and track progress across 10 training domains." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const LOOP = [
  { icon: Ruler, label: "Measure" },
  { icon: CalendarCheck, label: "Plan" },
  { icon: Activity, label: "Train" },
  { icon: Gauge, label: "Track" },
  { icon: LineChart, label: "Analyze" },
  { icon: RefreshCw, label: "Adapt" },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <div className="flex gap-2">
          <Button variant="ghost" asChild><Link to="/auth">Sign in</Link></Button>
          <Button variant="hero" asChild><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <p className="eyebrow">Human performance platform</p>
          <h1 className="mt-4 max-w-2xl text-5xl font-extrabold leading-[1.02] sm:text-6xl">
            Train with structure.<br /><span className="text-primary">Progress with evidence.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            A short assessment builds your weekly plan across ten training domains. Complete daily sessions, log every set, and see consistency and capability improve.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" variant="hero" asChild><Link to="/auth" search={{ mode: "signup" }}>Start your assessment <ArrowRight /></Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/auth">I have an account</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="eyebrow">The loop</p>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {LOOP.map((s, i) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <span className="stat-num text-xs text-muted-foreground">0{i + 1}</span>
              <s.icon className="mt-3 size-5 text-primary" />
              <p className="mt-2 font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="text-3xl font-bold">Ten domains. One coherent plan.</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {DOMAINS.map((d) => (
            <div key={d.id} className="rounded-xl border border-border bg-card p-4">
              <d.icon className="size-5 text-primary" />
              <p className="mt-3 font-semibold">{d.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{d.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid gap-6 rounded-2xl border border-border bg-card bg-hero p-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold">Transparent by design</h2>
            <p className="mt-2 text-muted-foreground">Plans come from explicit, rules-based safety and scheduling logic — and every plan explains why it was built. The AI Coach is clearly labelled as a demo until a live model is connected.</p>
          </div>
          <ul className="space-y-2 text-sm">
            <li>✓ Progress measured by consistency, capability and wellbeing — never appearance</li>
            <li>✓ Your data is private to your account</li>
            <li>✓ Conservative defaults for under-18 users</li>
          </ul>
        </div>
        <div className="mt-8"><Disclaimer /></div>
      </section>
    </div>
  );
}
