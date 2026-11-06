import type { ReactNode } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { domainById } from "@/lib/domains";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ className, children, title, action }: { className?: string; children: ReactNode; title?: string; action?: ReactNode }) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="eyebrow">{label}</p>
      <p className="stat-num mt-2 text-3xl font-medium">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function DomainBadge({ domain, className }: { domain: string; className?: string }) {
  const d = domainById(domain);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium", className)}>
      <d.icon className="size-3.5 text-primary" />{d.short}
    </span>
  );
}

export function IntensityPill({ level }: { level: string }) {
  const map: Record<string, string> = { low: "text-teal", moderate: "text-warning", high: "text-destructive" };
  return <span className={cn("stat-num text-xs uppercase", map[level])}>● {level}</span>;
}

export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />{label}…
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-8 text-center">
      <AlertTriangle className="size-6 text-destructive" />
      <p className="text-sm">{error instanceof Error ? error.message : "Something went wrong."}</p>
      {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>}
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-10 text-center">
      <p className="font-semibold">{title}</p>
      {children && <p className="max-w-sm text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Disclaimer() {
  return (
    <p className="text-xs text-muted-foreground">
      Human Performance AI offers general fitness guidance and is not medical care. It does not diagnose, treat or prevent any condition. Consult a qualified professional for health concerns.
    </p>
  );
}
