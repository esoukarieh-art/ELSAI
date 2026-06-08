"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import scenariosData from "@/data/home-demo-scenarios.json";

type Role = "user" | "assistant";
interface DemoMessage {
  role: Role;
  text: string;
}
interface Scenario {
  id: string;
  label: string;
  tag: string;
  audience: "adult" | "minor";
  messages: DemoMessage[];
}

const SCENARIOS = (scenariosData.scenarios as Scenario[]) || [];

const TYPING_PER_CHAR_MS = 12;
const PAUSE_BEFORE_REPLY_MS = 600;
const PAUSE_AFTER_MESSAGE_MS = 700;

export default function HomeDemoChat() {
  const [activeId, setActiveId] = useState<string>(SCENARIOS[0]?.id ?? "");
  const [shownMessages, setShownMessages] = useState<DemoMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [done, setDone] = useState(false);
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const containerRef = useRef<HTMLDivElement>(null);

  const scenario = useMemo(
    () => SCENARIOS.find((s) => s.id === activeId) ?? SCENARIOS[0],
    [activeId],
  );

  useEffect(() => {
    if (!scenario) return;
    cancelRef.current.cancelled = true;
    const ctrl = { cancelled: false };
    cancelRef.current = ctrl;

    setShownMessages([]);
    setDone(false);
    setIsTyping(false);

    (async () => {
      for (let i = 0; i < scenario.messages.length; i++) {
        const msg = scenario.messages[i];
        if (ctrl.cancelled) return;

        if (msg.role === "assistant") {
          setIsTyping(true);
          await wait(PAUSE_BEFORE_REPLY_MS);
          if (ctrl.cancelled) return;
          setIsTyping(false);
          await typeOut(
            msg,
            (partial) => {
              if (ctrl.cancelled) return;
              setShownMessages((prev) => {
                const base = prev.filter(
                  (m) =>
                    !(
                      m.role === "assistant" &&
                      m === prev[prev.length - 1] &&
                      m.text !== msg.text &&
                      m.text === partial
                    ),
                );
                return appendOrUpdate(prev, partial, "assistant");
              });
            },
            ctrl,
          );
        } else {
          await wait(400);
          if (ctrl.cancelled) return;
          setShownMessages((prev) => [...prev, msg]);
        }
        await wait(PAUSE_AFTER_MESSAGE_MS);
      }
      if (!ctrl.cancelled) setDone(true);
    })();

    return () => {
      ctrl.cancelled = true;
    };
  }, [scenario]);

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shownMessages, isTyping]);

  if (!scenario) return null;

  return (
    <section aria-labelledby="home-demo-title" className="bg-elsai-creme/60">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
              Démo · sans inscription
            </p>
            <h2
              id="home-demo-title"
              className="text-elsai-pin-dark mt-2 font-serif text-2xl tracking-tight md:text-3xl"
            >
              Voyez comment ça se passe.
            </h2>
            <p className="text-elsai-ink/70 mt-2 max-w-2xl text-sm">
              Choisissez une situation pour voir un échange réel — c'est juste une démo, rien n'est
              envoyé.
            </p>
          </div>
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Scénarios de démonstration"
        >
          {SCENARIOS.map((s) => {
            const active = s.id === activeId;
            return (
              <button
                key={s.id}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveId(s.id)}
                className={`rounded-organic border px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-elsai-pin text-elsai-creme border-elsai-pin"
                    : "border-elsai-pin/20 text-elsai-pin-dark hover:bg-elsai-pin/5"
                }`}
              >
                <span className="mr-1.5 text-[10px] tracking-widest uppercase opacity-70">
                  {s.tag}
                </span>
                {s.label}
              </button>
            );
          })}
        </div>

        <div
          ref={containerRef}
          className="rounded-organic border-elsai-pin/15 bg-elsai-creme shadow-organic mt-5 max-h-[420px] min-h-[360px] overflow-y-auto border p-5 md:p-6"
          aria-live="polite"
          aria-busy={isTyping}
        >
          <ul className="flex flex-col gap-3">
            {shownMessages.map((m, i) => (
              <li key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "bg-elsai-pin text-elsai-creme"
                      : "text-elsai-ink border-elsai-pin/10 border bg-white"
                  }`}
                >
                  {m.text}
                </div>
              </li>
            ))}
            {isTyping && (
              <li className="flex justify-start">
                <div className="text-elsai-ink border-elsai-pin/10 inline-flex items-center gap-1 rounded-2xl border bg-white px-4 py-2.5 shadow-sm">
                  <Dot delay={0} />
                  <Dot delay={150} />
                  <Dot delay={300} />
                </div>
              </li>
            )}
          </ul>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            href={`/start?scenario=${scenario.id}`}
            className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic hover:bg-elsai-pin-dark inline-flex items-center px-5 py-3 text-sm font-semibold"
          >
            {done ? "Continuer dans le vrai chat →" : "Poser ma question maintenant →"}
          </Link>
          <p className="text-elsai-ink/60 text-xs">
            Aucun message n'est envoyé tant que vous ne lancez pas un vrai chat.
          </p>
        </div>
      </div>
    </section>
  );
}

function appendOrUpdate(prev: DemoMessage[], text: string, role: Role): DemoMessage[] {
  if (prev.length === 0 || prev[prev.length - 1].role !== role) {
    return [...prev, { role, text }];
  }
  const copy = prev.slice();
  const last = copy[copy.length - 1];
  if (last.text.length > text.length) return copy;
  copy[copy.length - 1] = { role, text };
  return copy;
}

async function typeOut(
  msg: DemoMessage,
  onChunk: (partial: string) => void,
  ctrl: { cancelled: boolean },
): Promise<void> {
  let i = 0;
  while (i < msg.text.length) {
    if (ctrl.cancelled) return;
    const step = Math.max(1, Math.round(msg.text.length / 60));
    i = Math.min(msg.text.length, i + step);
    onChunk(msg.text.slice(0, i));
    await wait(TYPING_PER_CHAR_MS * step);
  }
}

function wait(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      aria-hidden
      className="bg-elsai-pin/60 inline-block h-1.5 w-1.5 animate-bounce rounded-full"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
