import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProfileForm } from "@/components/ProfileForm";
import { Logo } from "@/components/Logo";
import { Disclaimer, Loading, ErrorState } from "@/components/ui-kit";
import { createPlanFor, useProfile } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Assessment — Human Performance AI" }, { name: "description", content: "Your first-run training assessment." }] }),
  component: Onboarding,
});

function Onboarding() {
  const { data: profile, isLoading, error, refetch } = useProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Logo />
      <p className="eyebrow mt-10">Step 1 of 1 · Assessment</p>
      <h1 className="mt-2 text-4xl font-bold">Let's measure your starting point</h1>
      <p className="mt-2 text-muted-foreground">About 3 minutes. Your answers build a baseline and a personalised weekly plan. Optional fields are clearly marked.</p>
      <div className="mt-8">
        {isLoading ? <Loading /> : error || !profile ? <ErrorState error={error} onRetry={() => refetch()} /> : (
          <ProfileForm initial={profile} submitLabel="Build my plan" onSubmit={async (v) => {
            const { data, error } = await supabase.from("profiles").update({ ...v, onboarded: true }).eq("id", profile.id).select().single();
            if (error) throw error;
            await createPlanFor(data);
            await qc.invalidateQueries();
            toast.success("Your plan is ready");
            navigate({ to: "/plan" });
          }} />
        )}
      </div>
      <div className="mt-8"><Disclaimer /></div>
    </div>
  );
}
