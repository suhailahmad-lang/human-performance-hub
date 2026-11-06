import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Empty, Loading, ErrorState, PageHeader } from "@/components/ui-kit";
import { todayISO, useActivePlan } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/today")({
  head: () => ({ meta: [{ title: "Today's Workout — Human Performance AI" }, { name: "description", content: "Your session for today." }] }),
  component: Today,
});

function Today() {
  const { data, isLoading, error, refetch } = useActivePlan();
  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  const w = data?.workouts.find((x) => x.scheduled_date === todayISO());
  if (w) return <Navigate to="/workout/$id" params={{ id: w.id }} replace />;
  return (
    <>
      <PageHeader eyebrow="Today" title="Rest day" />
      <Empty title="No session planned today" action={<Button variant="outline" asChild><Link to="/plan">View weekly plan</Link></Button>}>
        Recovery is part of training. Try a recovery walk or box breathing from the library.
      </Empty>
    </>
  );
}
