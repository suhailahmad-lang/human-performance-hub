import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "@/components/ProfileForm";
import { PageHeader, Panel, Loading, ErrorState, Disclaimer } from "@/components/ui-kit";
import { createPlanFor, useProfile, useUser } from "@/lib/data";
import { GOALS } from "@/lib/domains";
import { trainingDayCount, allowHighIntensity, toPlannerProfileSafe } from "@/lib/settings-helpers";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Profile & Settings — Human Performance AI" }, { name: "description", content: "Edit your profile and regenerate your plan." }] }),
  component: Settings,
});

function Settings() {
  const { data: profile, isLoading, error, refetch } = useProfile();
  const { data: user } = useUser();
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  if (isLoading) return <Loading />;
  if (error || !profile) return <ErrorState error={error} onRetry={() => refetch()} />;
  const pp = toPlannerProfileSafe(profile);

  async function regenerate() {
    setBusy(true);
    try { await createPlanFor(profile!); await qc.invalidateQueries(); toast.success("New plan generated"); navigate({ to: "/plan" }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not generate plan"); }
    finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader eyebrow="Account" title="Profile & Settings" description={user?.email ?? undefined}
        action={<Button variant="hero" onClick={regenerate} disabled={busy}><RefreshCw className={busy ? "animate-spin" : ""} />{busy ? "Generating…" : "Regenerate plan"}</Button>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProfileForm initial={profile} submitLabel="Save profile" onSubmit={async (v) => {
            const { error } = await supabase.from("profiles").update(v).eq("id", profile.id);
            if (error) throw error;
            await qc.invalidateQueries({ queryKey: ["profile"] });
            toast.success("Profile saved. Regenerate your plan to apply changes.");
          }} />
        </div>
        <div className="space-y-4">
          <Panel title="Baseline summary">
            <dl className="space-y-2 text-sm">
              {[
                ["Goal", GOALS.find((g) => g.id === profile.primary_goal)?.label ?? "—"],
                ["Experience", profile.experience ?? "—"],
                ["Activity", profile.activity_level ?? "—"],
                ["Planned days", `${trainingDayCount(pp)} of ${profile.days_per_week ?? "—"} requested`],
                ["Session length", `${profile.session_minutes ?? "—"} min`],
                ["High-intensity drills", allowHighIntensity(pp) ? "Allowed" : "Not yet"],
              ].map(([k, val]) => (
                <div key={k} className="flex justify-between gap-2"><dt className="text-muted-foreground">{k}</dt><dd className="capitalize">{val}</dd></div>
              ))}
            </dl>
          </Panel>
          <Panel title="Privacy"><p className="text-sm text-muted-foreground">Your profile, plans and logs are private to your account. Height, weight and gender are optional and never used for appearance scoring.</p></Panel>
          <Disclaimer />
        </div>
      </div>
    </>
  );
}
