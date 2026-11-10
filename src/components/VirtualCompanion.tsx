import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { LoaderCircle, MessageCircle, Mic, MicOff, Minus, Send, Sparkles, Volume2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SpeechResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  const browserWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  const Recognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
  return Recognition ? new Recognition() : null;
}

type CompanionChatMessage = { role: "user" | "assistant"; content: string };

interface VirtualCompanionProps {
  pathname: string;
}

function companionMessage(pathname: string) {
  if (pathname.startsWith("/workout/") || pathname === "/today")
    return "I can help you stay focused on your session. Ask me about an exercise or your training plan.";
  if (pathname.startsWith("/library"))
    return "Explore an exercise and open its guide to learn the movement safely.";
  if (pathname.startsWith("/progress"))
    return "Your progress is about consistency and capability. Let's review your training trends.";
  if (pathname.startsWith("/plan"))
    return "Here's your training schedule. Remember, recovery days are part of the plan.";
  if (pathname.startsWith("/coach"))
    return "I'm your in-platform companion. The separate AI Coach is available in its own section.";
  if (pathname.startsWith("/settings"))
    return "You can review your profile and training preferences here.";
  return "Hey, I’m NOVA! We can chat about your ideas, interests, everyday questions, or your performance goals. What’s on your mind?";
}

/**
 * Persistent original virtual companion.
 * This is the always-visible character shell; voice, lip-sync and 3D animation
 * are intentionally separate integrations and are not simulated here.
 */
export function VirtualCompanion({ pathname }: VirtualCompanionProps) {
  const [open, setOpen] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Voice input is available in supported browsers.");
  const [chatMessages, setChatMessages] = useState<CompanionChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const message = companionMessage(pathname);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = getSpeechRecognition();
    if (!recognition) {
      setVoiceStatus("Voice input is not supported in this browser. Try a recent Chrome or Edge browser.");
      return;
    }

    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ");
      setDraft(transcript.trim());
    };
    recognition.onerror = () => {
      setVoiceStatus("Microphone access or speech recognition failed. Check browser permissions.");
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setVoiceStatus("Listening… speak naturally.");
    setListening(true);
    recognition.start();
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    const nextMessages: CompanionChatMessage[] = [
      ...chatMessages,
      { role: "user", content: text },
    ].slice(-12);
    setChatMessages(nextMessages);
    setDraft("");
    setChatError("");
    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("nova-chat", {
        body: { messages: nextMessages },
      });
      if (error) throw error;
      if (!data || typeof data.reply !== "string") {
        throw new Error("NOVA returned an invalid response.");
      }
      setChatMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply },
      ].slice(-12));
    } catch (error) {
      console.error("NOVA chat failed:", error);
      setChatError(
        error instanceof Error
          ? error.message
          : "NOVA could not reply. Check your connection and sign-in.",
      );
      setDraft(text);
    } finally {
      setSending(false);
    }
  }

  function speakGreeting() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoiceStatus("Speech playback is not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const latestReply = [...chatMessages].reverse().find((item) => item.role === "assistant")?.content;
    const utterance = new SpeechSynthesisUtterance(latestReply ?? message);
    utterance.lang = "en-IN";
    utterance.rate = 0.96;
    window.speechSynthesis.speak(utterance);
    setVoiceStatus("Playing the browser's available voice. A dedicated NOVA voice is still being integrated.");
  }

  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => {
          setDismissed(false);
          setOpen(true);
        }}
        aria-label="Show virtual companion"
        className="fixed bottom-24 right-4 z-40 grid size-14 place-items-center rounded-full border border-primary/50 bg-card shadow-xl shadow-primary/10 transition hover:scale-105 lg:bottom-5 lg:right-5"
      >
        <CompanionAvatar compact />
      </button>
    );
  }

  return (
    <aside
      aria-label="Virtual companion"
      className="fixed bottom-24 right-3 z-40 flex w-[min(19rem,calc(100vw-1.5rem))] flex-col items-end gap-2 lg:bottom-5 lg:right-5"
    >
      {open && (
        <section className="w-full overflow-hidden rounded-2xl border border-primary/25 bg-card/95 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <header className="flex items-center justify-between border-b border-border px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-full bg-primary/15 text-primary">
                <Sparkles className="size-4" />
              </span>
              <div>
                <p className="text-xs font-semibold">NOVA</p>
                <p className="text-[10px] text-muted-foreground">NOVA · AI companion</p>
              </div>
              <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-[9px] text-muted-foreground">Preview</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Minimize companion message"
              >
                <Minus className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Hide companion"
              >
                <X className="size-4" />
              </button>
            </div>
          </header>
          <div className="flex items-center gap-3 p-3">
            <div className="w-[5.5rem] shrink-0">
              <CompanionAvatar />
            </div>
            <div className="min-w-0">
              <p className="text-sm leading-relaxed text-foreground">{message}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={speakGreeting}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] text-muted-foreground hover:bg-secondary"
                >
                  <Volume2 className="size-3" /> Hear NOVA
                </button>
                <button
                  type="button"
                  onClick={toggleListening}
                  className="inline-flex items-center gap-1 rounded-md border border-primary/30 px-2 py-1 text-[10px] text-primary hover:bg-primary/10"
                  aria-pressed={listening}
                >
                  {listening ? <MicOff className="size-3" /> : <Mic className="size-3" />}
                  {listening ? "Stop" : "Speak"}
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-border px-3 py-2">
            <div aria-live="polite" className="mb-2 max-h-40 space-y-2 overflow-y-auto">
              {chatMessages.length === 0 ? (
                <p className="text-[10px] text-muted-foreground">
                  Say hello or ask me something. NOVA is an AI companion, not a human.
                </p>
              ) : (
                chatMessages.map((item, index) => (
                  <div
                    key={`${item.role}-${index}`}
                    className={item.role === "user" ? "ml-5 rounded-lg bg-primary/10 px-2 py-1.5 text-xs" : "mr-3 rounded-lg bg-secondary px-2 py-1.5 text-xs"}
                  >
                    <span className="mb-0.5 block text-[9px] font-semibold text-muted-foreground">
                      {item.role === "user" ? "YOU" : "NOVA"}
                    </span>
                    {item.content}
                  </div>
                ))
              )}
            </div>
            <form onSubmit={sendMessage} className="space-y-2">
              <label htmlFor="nova-voice-draft" className="text-[10px] font-medium text-muted-foreground">Message NOVA</label>
              <textarea
                id="nova-voice-draft"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Speak or type a message…"
                rows={2}
                maxLength={1500}
                className="w-full resize-none rounded-lg border border-border bg-background/70 px-2 py-1.5 text-xs outline-none focus:border-primary"
              />
              <div className="flex items-center justify-between gap-2">
                <p aria-live="polite" className="min-w-0 text-[10px] text-muted-foreground">{voiceStatus}</p>
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? <LoaderCircle className="size-3 animate-spin" /> : <Send className="size-3" />}
                  {sending ? "Replying" : "Send"}
                </button>
              </div>
              {chatError && <p role="alert" className="text-[10px] text-destructive">{chatError}</p>}
            </form>
          </div>
        </section>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-primary/40 bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-lg transition hover:border-primary hover:shadow-primary/10"
        aria-expanded={open}
        aria-label={open ? "Collapse companion" : "Open companion"}
      >
        <span className="grid size-8 place-items-center rounded-full bg-primary/10">
          <CompanionAvatar compact />
        </span>
        NOVA
        <MessageCircle className="size-3.5 text-primary" />
      </button>
    </aside>
  );
}

function CompanionAvatar({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      viewBox="0 0 120 150"
      role="img"
      aria-label="NOVA, original anime-inspired virtual companion"
      className={compact ? "size-7" : "h-auto w-full drop-shadow-[0_8px_18px_rgba(34,211,238,0.16)]"}
    >
      <defs>
        <linearGradient id="nova-hair" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d8f7ff" />
          <stop offset="0.55" stopColor="#76d9ee" />
          <stop offset="1" stopColor="#6677cf" />
        </linearGradient>
        <linearGradient id="nova-sari" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6a6c8" />
          <stop offset="0.55" stopColor="#bd4f88" />
          <stop offset="1" stopColor="#702b65" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="142" rx="34" ry="5" fill="#50d9ec" opacity=".18" />
      <path d="M29 145 Q31 111 43 103 L77 103 Q91 113 93 145Z" fill="url(#nova-sari)" stroke="#f8c5dd" strokeWidth="1.5" />
      <path d="M43 104 Q60 98 77 104 L83 119 Q60 128 37 119Z" fill="#702b65" stroke="#f8c5dd" strokeWidth="1.2" />
      <path d="M34 145 L42 111 Q53 116 60 130 Q69 116 81 111 L91 145Z" fill="url(#nova-sari)" stroke="#f6c2d9" strokeWidth="1" />
      <path d="M39 108 Q53 113 60 130 Q69 114 84 108 L91 145 L30 145Z" fill="none" stroke="#ffe0ed" strokeWidth="2" />
      <path d="M78 105 Q91 109 103 127 L94 145 L72 133 Q83 120 78 105Z" fill="#c65391" stroke="#ffe0ed" strokeWidth="1.4" />
      <path d="M80 108 Q93 119 98 136" fill="none" stroke="#ffe7f2" strokeWidth="1.5" />
      <path d="M35 139 Q59 132 89 139" fill="none" stroke="#f9d7e7" strokeWidth="1.4" />
      <path d="M44 105 L38 119 M49 108 L44 124 M74 108 L80 123" stroke="#f7c5dc" strokeWidth="1" />
      <path d="M42 44 Q39 14 64 12 Q91 14 86 54 L82 88 Q77 105 60 106 Q42 102 37 82Z" fill="url(#nova-hair)" />
      <path d="M39 55 Q29 27 48 17 Q64 2 82 18 Q99 31 85 62 Q81 42 68 34 Q59 49 42 54Z" fill="#a6eff8" stroke="#d9fbff" strokeWidth="1" />
      <path d="M41 48 Q29 55 35 82 Q39 96 48 100 L46 71Z" fill="#78d8ed" />
      <path d="M82 45 Q96 55 87 88 Q83 98 75 102 L77 68Z" fill="#617bd1" />
      <ellipse cx="60" cy="62" rx="23" ry="29" fill="#f5d9d3" />
      <path d="M38 54 Q42 34 59 34 Q77 35 83 53 Q72 45 65 45 Q53 53 38 54Z" fill="url(#nova-hair)" />
      <path d="M42 61 Q49 56 55 62" fill="none" stroke="#34476d" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M66 62 Q73 56 79 61" fill="none" stroke="#34476d" strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cx="50" cy="67" rx="3.4" ry="5" fill="#4aaecb" />
      <ellipse cx="71" cy="67" rx="3.4" ry="5" fill="#4aaecb" />
      <circle cx="51" cy="65" r="1.2" fill="white" />
      <circle cx="72" cy="65" r="1.2" fill="white" />
      <path d="M58 76 Q61 79 64 76" fill="none" stroke="#bd7b83" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M51 86 Q60 91 69 86" fill="none" stroke="#c77d89" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M36 55 Q27 36 40 19 Q50 3 68 9 Q89 11 93 34 Q83 25 78 23 Q69 39 51 42 Q43 47 36 55Z" fill="url(#nova-hair)" stroke="#d8faff" strokeWidth="1" />
      <path d="M39 25 Q28 42 34 66" fill="none" stroke="#f2ffff" strokeWidth="2" opacity=".8" />
      <path d="M82 28 Q91 43 84 60" fill="none" stroke="#b8f6ff" strokeWidth="2" opacity=".8" />
      <path d="M54 120 L60 127 L66 120" fill="none" stroke="#ffe0ed" strokeWidth="2" />
      <circle cx="60" cy="133" r="3" fill="#ffe0ed" />
    </svg>
  );
}
