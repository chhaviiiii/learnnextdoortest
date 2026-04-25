"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LifeBuoy, LogOut, Menu, MessageCircle, Send, Sparkles, UserCircle2, X } from "lucide-react";
import { LogoutButton } from "./LogoutButton";

type Msg = { role: "user" | "assistant"; content: string };

const STARTER_PROMPTS = [
  "I want my 8-year-old to try music",
  "Weekend yoga for beginners",
  "Coding classes for a shy 12-year-old",
  "Cooking workshop for adults",
];

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Hi! I'm Zoe. Tell me what you're looking for — subject, age, preferred days or budget — and I'll find the right class in your neighbourhood.",
};

/** Tiny markdown renderer for `[text](url)` links + newlines. Keeps the bundle lean. */
function renderContent(text: string) {
  // Split by newline first so each line renders as its own <p>.
  const lines = text.split("\n");
  return lines.map((line, li) => {
    const parts: React.ReactNode[] = [];
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIdx) parts.push(line.slice(lastIdx, match.index));
      parts.push(
        <a
          key={`l-${li}-${key++}`}
          href={match[2]}
          className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-700"
        >
          {match[1]}
        </a>
      );
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < line.length) parts.push(line.slice(lastIdx));
    return (
      <p key={li} className="[&:not(:first-child)]:mt-1.5">
        {parts.length === 0 ? "\u00A0" : parts}
      </p>
    );
  });
}

export function AssistantDrawer() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // Scroll to bottom and focus input when the drawer opens or a new message lands.
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const userMsg: Msg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              data?.error ??
              "Something went wrong. Make sure ANTHROPIC_API_KEY is set and try again.",
          },
        ]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: String(data.reply ?? "") }]);
      }
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Connection error. Please try again in a moment." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open Zoe, the AI discovery assistant"
          className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-brand-gradient px-4 py-2.5 text-xs font-semibold text-white shadow-float transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 sm:bottom-6 sm:right-6 sm:px-5 sm:py-3 sm:text-sm"
        >
          <Sparkles className="h-4 w-4" />
          <span>Ask Zoe</span>
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300 ring-2 ring-emerald-100" />
        </button>
      )}

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end md:p-6">
          {/* Backdrop on mobile */}
          <button
            aria-label="Close assistant"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink-900/20 backdrop-blur-sm md:hidden"
          />
          <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-float md:h-[640px] md:max-h-[80vh] md:w-[420px] md:rounded-3xl md:ring-1 md:ring-ink-800/10">
            {/* Header */}
            <header className="flex items-center justify-between gap-3 bg-brand-gradient px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/40">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold leading-tight">Zoe</div>
                  <div className="text-[11px] leading-tight text-white/80">
                    Your neighbourhood class finder
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {/* Message list */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto bg-surface-50 px-4 py-5"
            >
              <ul className="flex flex-col gap-3">
                {messages.map((m, i) => (
                  <li
                    key={i}
                    className={
                      m.role === "user"
                        ? "self-end max-w-[85%] rounded-2xl rounded-br-md bg-ink-800 px-4 py-2.5 text-sm text-white"
                        : "self-start max-w-[90%] rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-ink-800 shadow-card ring-1 ring-ink-800/5"
                    }
                  >
                    {m.role === "assistant" ? (
                      <div className="space-y-1 leading-relaxed">{renderContent(m.content)}</div>
                    ) : (
                      <span>{m.content}</span>
                    )}
                  </li>
                ))}
                {busy && (
                  <li className="self-start inline-flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-ink-500 shadow-card ring-1 ring-ink-800/5">
                    <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:-0.2s]" />
                    <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:-0.1s]" />
                    <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400" />
                  </li>
                )}
              </ul>

              {/* Starter prompts, only when the convo is fresh */}
              {messages.length === 1 && !busy && (
                <div className="mt-5">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                    Try one of these
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {STARTER_PROMPTS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => send(p)}
                        className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink-700 shadow-card ring-1 ring-ink-800/10 hover:bg-brand-50 hover:text-brand-700"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="border-t border-ink-800/5 bg-white p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
            >
              <div className="flex items-center gap-2 rounded-2xl bg-surface-100 px-3 py-2 focus-within:ring-2 focus-within:ring-brand-300">
                <MessageCircle className="h-4 w-4 shrink-0 text-ink-500" />
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Zoe anything..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-400"
                  disabled={busy}
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  aria-label="Send"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-white shadow-sm transition hover:brightness-110 disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-2 px-1 text-[10px] leading-relaxed text-ink-400">
                Zoe recommends classes from our live catalog. She can make mistakes — always check the
                class page before booking.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function StudentMenuDrawer({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);
  const firstName = userName.split(" ")[0] || "You";
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onMouseDown(event: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("mousedown", onMouseDown);
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open account menu"
        className="inline-flex items-center justify-center rounded-full border border-ink-800/10 bg-white p-2 text-ink-800 hover:bg-surface-100"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient text-[11px] font-bold text-white">
          {firstName.slice(0, 1).toUpperCase()}
        </span>
      </button>

      {open && (
        <aside className="absolute right-0 top-[calc(100%+0.5rem)] z-50 flex w-[240px] flex-col rounded-2xl bg-white shadow-xl ring-1 ring-ink-800/10">
            <header className="flex items-center justify-between border-b border-ink-800/5 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-ink-900">{firstName}</div>
                <div className="text-xs text-ink-500">Menu</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-100 text-ink-700 hover:bg-surface-200"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <nav className="flex-1 p-2">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-800 hover:bg-surface-100"
              >
                <UserCircle2 className="h-4 w-4" />
                My Account
              </Link>

              <Link
                // href="mailto:support@learnnextdoor.com?subject=LearnNextDoor%20Support"
                href="/"
                onClick={() => setOpen(false)}
                className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-800 hover:bg-surface-100"
              >
                <LifeBuoy className="h-4 w-4" />
                Contact Us
              </Link>
              <LogoutButton>
                <span className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-800 hover:bg-surface-100">
                  <LogOut className="h-4 w-4" />
                  Logout
                </span>
              </LogoutButton>
            </nav>
          </aside>
      )}
    </div>
  );
}
