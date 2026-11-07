import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  CalendarDays,
  PlayCircle,
  Library,
  LineChart,
  Bot,
  Settings,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/data";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/plan", label: "My Plan", icon: CalendarDays },
  { to: "/today", label: "Today", icon: PlayCircle },
  { to: "/library", label: "Library", icon: Library },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/coach", label: "AI Coach", icon: Bot },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell() {
  const { data: profile, isLoading } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const onOnboarding = location.pathname.startsWith("/onboarding");

  useEffect(() => {
    if (!isLoading && profile && !profile.onboarded && !onOnboarding)
      navigate({ to: "/onboarding" });
  }, [isLoading, profile, onOnboarding, navigate]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (onOnboarding)
    return (
      <div className="min-h-screen bg-background bg-hero">
        <Outlet />
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <Link to="/dashboard" className="px-2 py-3">
          <Logo />
        </Link>
        <nav className="mt-6 flex flex-1 flex-col gap-1" aria-label="Main">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-accent text-primary font-semibold" }}
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border pt-4">
          <p className="truncate px-3 text-sm font-medium">{profile?.display_name ?? "Athlete"}</p>
          <button
            onClick={signOut}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/dashboard">
          <Logo />
        </Link>
        <button
          onClick={signOut}
          aria-label="Sign out"
          className="rounded-md p-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-4" />
        </button>
      </header>

      <main className="pb-24 lg:pb-10 lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
          <Outlet />
        </div>
      </main>

      <nav
        aria-label="Main mobile"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-border bg-sidebar/95 backdrop-blur lg:hidden"
      >
        {NAV.filter((n) => n.to !== "/settings").map((n) => {
          const active = location.pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px]",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <n.icon className="size-5" />
              {n.label.replace("My ", "")}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
