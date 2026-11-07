import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { PageHeader, Panel, DomainBadge, Loading, ErrorState, Empty } from "@/components/ui-kit";
import { useExercises } from "@/lib/data";
import { ALTERNATIVE_EQUIPMENT_SLUGS, EQUIPMENT } from "@/lib/domains";

export const Route = createFileRoute("/_authenticated/library/$slug")({
  head: () => ({
    meta: [
      { title: "Exercise — Human Performance AI" },
      { name: "description", content: "Exercise details and coaching cues." },
      { property: "og:title", content: "Exercise — Human Performance AI" },
      { property: "og:description", content: "Exercise details and coaching cues." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Detail,
});

function Detail() {
  const { slug } = Route.useParams();
  const { data, isLoading, error, refetch } = useExercises();
  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  const e = data?.find((x) => x.slug === slug);
  if (!e) return <Empty title="Exercise not found" />;
  const eq = e.equipment
    .map((x) => (x === "none" ? "Bodyweight" : (EQUIPMENT.find((q) => q.id === x)?.label ?? x)))
    .join(ALTERNATIVE_EQUIPMENT_SLUGS.has(e.slug) ? " or " : " + ");
  return (
    <>
      <Link
        to="/library"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Library
      </Link>
      <PageHeader
        eyebrow={`${e.difficulty} · ${e.pattern}`}
        title={e.name}
        description={e.description}
        action={<DomainBadge domain={e.domain} />}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Panel title="Coaching cues" className="md:col-span-2">
          <ol className="space-y-3">
            {e.cues.map((c, i) => (
              <li key={c} className="flex gap-3">
                <span className="stat-num text-primary">0{i + 1}</span>
                {c}
              </li>
            ))}
          </ol>
        </Panel>
        <div className="space-y-4">
          <Panel title="Default prescription">
            <p className="stat-num text-lg">{e.prescription}</p>
          </Panel>
          <Panel title="Equipment">
            <p className="text-sm">{eq}</p>
          </Panel>
          {e.high_intensity && (
            <div className="flex gap-2 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
              <AlertTriangle className="size-4 shrink-0 text-warning" />
              High-intensity drill. Excluded for beginners and under-18 profiles.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
