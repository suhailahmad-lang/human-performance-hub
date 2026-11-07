import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) =>
    s["mode"] === "signup" ? { mode: "signup" as const } : {},
  head: () => ({
    meta: [
      { title: "Sign in — Human Performance AI" },
      { name: "description", content: "Sign in or create your Human Performance AI account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Sign in — Human Performance AI" },
      { property: "og:description", content: "Access your training plan and progress." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
});

function AuthPage() {
  const search = Route.useSearch();
  const mode = search.mode ?? "signin";
  const setMode = (mode: "signin" | "signup") =>
    navigate({ to: "/auth", search: mode === "signup" ? { mode } : {} });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = Route.useNavigate();

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (data.user) navigate({ to: "/dashboard" });
      })
      .catch(() => toast.error("Could not check sign-in"));
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) navigate({ to: "/dashboard" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check email and password");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          ...parsed.data,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) throw error;
        if (!data.session) setSent(true);
        else await navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        await navigate({ to: "/dashboard" });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    try {
      const r = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/auth",
      });
      if (r.error) toast.error("Google sign-in failed");
    } catch {
      toast.error("Google sign-in failed");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background bg-hero px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <div className="rounded-2xl border border-border bg-card p-6">
          {sent ? (
            <div className="text-center">
              <h1 className="text-xl font-bold">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a confirmation link to {email}. Open it to activate your account.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">
                {mode === "signup" ? "Create your account" : "Welcome back"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "signup"
                  ? "Start with a 3-minute assessment."
                  : "Sign in to continue training."}
              </p>
              <button
                type="button"
                onClick={google}
                className="mt-6 flex h-10 w-full items-center justify-center gap-2.5 rounded-md border border-[#8E918F] bg-[#131314] px-3 text-sm font-medium text-[#E3E3E3]"
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                  />
                </svg>
                Continue with Google
              </button>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                  {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
                </Button>
              </form>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
                <button
                  className="font-medium text-primary hover:underline"
                  onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                >
                  {mode === "signup" ? "Sign in" : "Create one"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
