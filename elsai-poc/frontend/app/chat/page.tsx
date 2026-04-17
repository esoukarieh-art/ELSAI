"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import ChatBubble from "@/components/ChatBubble";
import EmergencyBanner from "@/components/EmergencyBanner";
import { forgetMe, getProfile, sendMessage } from "@/lib/api";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [emergency, setEmergency] = useState<{ label: string; phone: string } | null>(null);
  const [profile, setProfile] = useState<"adult" | "minor">("adult");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProfile(getProfile());
    const stored = sessionStorage.getItem("elsai_conversation_id");
    if (stored) setConversationId(stored);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);
    try {
      const res = await sendMessage(userMsg, conversationId);
      setConversationId(res.conversation_id);
      sessionStorage.setItem("elsai_conversation_id", res.conversation_id);
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
      if (res.danger_detected && res.emergency_cta) {
        setEmergency(res.emergency_cta);
      }
    } catch (err: any) {
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ Erreur : ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleForget() {
    if (!confirm("Supprimer toute la conversation ? Cette action est définitive.")) return;
    await forgetMe();
    setMessages([]);
    setConversationId(undefined);
    location.href = "/";
  }

  const placeholder =
    profile === "minor" ? "Pose ta question librement…" : "Décrivez votre situation…";
  const intro =
    profile === "minor"
      ? "Bonjour, je suis ELSAI. Tu peux me poser n'importe quelle question. C'est confidentiel."
      : "Bonjour, je suis ELSAI. Décrivez votre situation, je vais essayer de vous aider.";

  const accentBar = profile === "minor" ? "bg-elsai-rose" : "bg-elsai-pin";

  return (
    <main className="flex min-h-screen flex-col">
      {/* Bande d'accent selon profil */}
      <div className={`h-1 w-full ${accentBar}`} />

      <header className="flex items-center justify-between border-b border-elsai-pin/10 bg-white/80 px-4 py-3 backdrop-blur">
        <Link href="/" className="flex items-center gap-2 font-bold text-elsai-pin-dark">
          <Image src="/logo-elsai.svg" alt="" width={32} height={32} />
          <span>ELSAI</span>
        </Link>
        <div className="flex gap-4 text-sm text-elsai-ink/70">
          <Link href="/scan" className="transition-colors hover:text-elsai-pin">
            Scanner un document
          </Link>
          <button
            onClick={handleForget}
            className="transition-colors hover:text-elsai-urgence"
            aria-label="Droit à l'oubli"
          >
            Tout oublier
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="mb-4 rounded-organic border border-elsai-pin/15 bg-white/70 p-5 leading-relaxed text-elsai-ink/80 shadow-organic backdrop-blur">
            {intro}
          </div>
        )}
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} content={m.content} />
        ))}
        {loading && <ChatBubble role="assistant" content="…" />}
      </div>

      <form
        onSubmit={submit}
        className="sticky bottom-0 border-t border-elsai-pin/15 bg-elsai-creme/95 p-3 backdrop-blur"
      >
        <div className="mx-auto flex max-w-2xl gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
            className="flex-1 rounded-organic border border-elsai-pin/20 bg-white px-4 py-3 placeholder:text-elsai-ink/40 focus:outline-none focus:ring-2 focus:ring-elsai-pin/60"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-organic bg-elsai-pin px-6 text-elsai-creme shadow-organic transition-colors hover:bg-elsai-pin-dark disabled:opacity-40"
          >
            Envoyer
          </button>
        </div>
      </form>

      {emergency && <EmergencyBanner cta={emergency} onClose={() => setEmergency(null)} />}
    </main>
  );
}
