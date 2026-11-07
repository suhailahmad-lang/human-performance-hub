import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageHeader, DomainBadge, Loading, ErrorState, Empty } from "@/components/ui-kit";
import { useExercises } from "@/lib/data";
import { DOMAINS, EQUIPMENT } from "@/lib/domains";

export const Route = createFileRoute("/_authenticated/library/")({
  head: () => ({
    meta: [
      { title: "Exercise Library — Human Performance AI" },
      {
        name: "description",
        content: "Search exercises by domain, difficulty, equipment and pattern.",
      },
      { property: "og:title", content: "Exercise Library — Human Performance AI" },
      {
        property: "og:description",
        content: "Search exercises by domain, difficulty, equipment and pattern.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Library,
});

const selectCls = "h-9 rounded-md border border-input bg-background px-3 text-sm";

function Library() {
  const { data, isLoading, error, refetch } = useExercises();
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState("");
  const [diff, setDiff] = useState("");
  const [equip, setEquip] = useState("");
  const [pattern, setPattern] = useState("");

  const patterns = useMemo(
    () => Array.from(new Set((data ?? []).map((e) => e.pattern))).sort(),
    [data],
  );
  const list = (data ?? []).filter(
    (e) =>
      (!q || `${e.name} ${e.description}`.toLowerCase().includes(q.toLowerCase())) &&
      (!domain || e.domain === domain) &&
      (!diff || e.difficulty === diff) &&
      (!equip || e.equipment.includes(equip)) &&
      (!pattern || e.pattern === pattern),
  );

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Exercise Library"
        description="Every exercise the planner can prescribe, with coaching cues."
      />
      <div className="mb-6 flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search exercises"
            placeholder="Search exercises…"
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <select
            aria-label="Domain"
            className={selectCls}
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          >
            <option value="">All domains</option>
            {DOMAINS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.short}
              </option>
            ))}
          </select>
          <select
            aria-label="Difficulty"
            className={selectCls}
            value={diff}
            onChange={(e) => setDiff(e.target.value)}
          >
            <option value="">Any level</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <select
            aria-label="Equipment"
            className={selectCls}
            value={equip}
            onChange={(e) => setEquip(e.target.value)}
          >
            <option value="">Any equipment</option>
            <option value="none">Bodyweight</option>
            {EQUIPMENT.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Movement pattern"
            className={selectCls}
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
          >
            <option value="">Any pattern</option>
            {patterns.map((p) => (
              <option key={p} value={p}>
                {p.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : list.length === 0 ? (
        <Empty title="No exercises match">Try clearing a filter.</Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => (
            <Link
              key={e.id}
              to="/library/$slug"
              params={{ slug: e.slug }}
              className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/60"
            >
              <div className="flex items-center justify-between">
                <DomainBadge domain={e.domain} />
                <span className="stat-num text-[10px] uppercase text-muted-foreground">
                  {e.difficulty}
                </span>
              </div>
              <p className="mt-3 font-semibold group-hover:text-primary">{e.name}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>
              <p className="stat-num mt-3 text-xs text-muted-foreground">
                {e.pattern} · {e.prescription}
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
