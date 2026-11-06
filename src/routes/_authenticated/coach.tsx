import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Panel, Disclaimer } from "@/components/ui-kit";
import { COACH_TOPICS, demoCoach, type CoachProvider } from "@/lib/coach";
import { useProfile } from "@/lib/data";
import { isMinor } from "@/lib/planner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/coach")({
  head: () => ({ meta: [{ title: "AI Coach (Demo) — Human Performance AI" }, { name: "description", content: "Staged AI coach with safe predefined guidance." }] }),
  component: Coach,
});

const provider: CoachProvider = demoCoach;
interface Msg { role: "user" | "coach"; text: string }

function Coach() {
  const { data: profile } = useProfile();
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "coach", text: "Hi! I'm the demo coach. Pick a topic or ask a training question. I give general guidance only." }]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  async function ask(text: string, label?: string) {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { role: "user", text: label ?? text }]);
    setInput("");
    setThinking(true);
    const r = await provider.reply(text.slice(0, 500), { displayName: profile?.display_name, goal: profile?.primary_goal, experience: profile?.experience, isMinor: isMinor(profile?.age_range ?? null) });
    setThinking(false);
    setMsgs((m) => [...m, { role: "coach", text: r.text }]);
  }

  return (
    <>
      <PageHeader eyebrow="Staged feature" title="AI Coach"
        action={<span className="inline-flex items-center gap-2 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs text-warning"><span className="size-2 rounded-full bg-warning" />Demo mode · no live AI connected</span>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="flex h-[60vh] flex-col lg:col-span-2">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", m.role === "coach" ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                  {m.role === "coach" ? <Bot className="size-4" /> : <User className="size-4" />}
                </span>
                <p className={cn("max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed", m.role === "coach" ? "bg-secondary" : "bg-primary/15")}>{m.text}</p>
              </div>
            ))}
            {thinking && <p className="text-xs text-muted-foreground">Coach is typing…</p>}
            <div ref={endRef} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="mt-4 flex gap-2">
            <Input aria-label="Message the coach" value={input} maxLength={500} onChange={(e) => setInput(e.target.value)} placeholder="Ask about soreness, warm-ups, progression…" />
            <Button type="submit" size="icon" aria-label="Send"><Send /></Button>
          </form>
        </Panel>
        <div className="space-y-4">
          <Panel title="Suggested topics">
            <div className="flex flex-col gap-2">{COACH_TOPICS.map((t) => (
              <Button key={t.id} variant="outline" className="h-auto justify-start whitespace-normal py-2 text-left" onClick={() => ask(t.id, t.label)}>{t.label}</Button>
            ))}</div>
          </Panel>
          <Panel title="About this feature">
            <p className="text-sm text-muted-foreground">Answers come from a fixed set of safe, predefined guidance — not a language model. A live AI connection is planned and will plug into the same interface.</p>
          </Panel>
          <Disclaimer />
        </div>
      </div>
    </>
  );
}
