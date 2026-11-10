import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { replacePlan } from "@/lib/training.functions";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProfileForm } from "@/components/ProfileForm";
import { Logo } from "@/components/Logo";
import { Disclaimer, Loading, ErrorState } from "@/components/ui-kit";
import { todayISO, useProfile } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Assessment — Human Performance AI" },
      { name: "description", content: "Your first-run training assessment." },
      { property: "og:title", content: "Assessment — Human Performance AI" },
      { property: "og:description", content: "Your first-run training assessment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { data: profile, isLoading, error, refetch } = useProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const generate = useServerFn(replacePlan);
  const planMutation = useMutation({ mutationFn: generate });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Logo />
      <p className="eyebrow mt-10">YOUR PERFORMANCE PROFILE</p>
      <h1 className="mt-2 text-4xl font-bold">Build your performance profile</h1>
      <p className="mt-2 text-muted-foreground">
        A guided assessment that turns your goals, experience and available time into a plan
        built around your real routine. You can leave optional measurements blank.
      </p>
      <div className="mt-8">
        {isLoading ? (
          <Loading />
        ) : error || !profile ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (
          <ProfileForm
            initial={profile}
            wizard
            submitLabel="Build my plan"
            onSubmit={async (v) => {
              const { data, error } = await supabase
                .from("profiles")
                .update(v)
                .eq("id", profile.id)
                .select()
                .single();
              if (error) throw error;
              await planMutation.mutateAsync({ data: { start: todayISO() } });
              await qc.invalidateQueries();
              toast.success("Your plan is ready");
              navigate({ to: "/plan" });
            }}
          />
        )}
      </div>
      <div className="mt-8">
        <Disclaimer />
      </div>
    </div>
  );
}
