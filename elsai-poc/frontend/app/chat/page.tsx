"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import ChatBubble from "@/components/ChatBubble";
import EmergencyBanner from "@/components/EmergencyBanner";
import VoiceRecorder from "@/components/VoiceRecorder";
import { forgetMe, getProfile, sendMessage, synthesizeSpeech } from "@/lib/api";

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
  const [voiceMode, setVoiceMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  async function playReply(text: string) {
    try {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      const blob = await synthesizeSpeech(text);
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = url;
      await audioRef.current.play();
    } catch {
      // synthèse optionnelle : on ignore silencieusement
    }
  }

  async function sendText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);
    try {
      const res = await sendMessage(trimmed, conversationId);
      setConversationId(res.conversation_id);
      sessionStorage.setItem("elsai_conversation_id", res.conversation_id);
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
      if (res.danger_detected && res.emergency_cta) {
        setEmergency(res.emergency_cta);
      }
      if (voiceMode) playReply(res.reply);
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `⚠️ Erreur : ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

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
    await sendText(input);
  }

  function handleVoice(text: string) {
    setInput("");
    sendText(text);
  }

  async function handleForget() {
    if (!confirm("Supprimer toute la conversation ? Cette action est définitive.")) return;
    await forgetMe();
    setMessages([]);
    setConversationId(undefined);
    location.href = "/";
  }

  const placeholder =
    profile === "minor"
      ? "Pose ta question librement…"
      : "Décrivez votre situation…";
  const intro =
    profile === "minor"
      ? "Bonjour, je suis ELSAI. Tu peux me poser n'importe quelle question. C'est confidentiel."
      : "Bonjour, je suis ELSAI. Décrivez votre situation, je vais essayer de vous aider.";

  const accentBar =
    profile === "minor" ? "bg-elsai-rose" : "bg-elsai-pin";

  return (
    <main className="min-h-screen flex flex-col">
      {/* Bande d'accent selon profil */}
      <div className={`h-1 w-full ${accentBar}`} />

      <header className="bg-white/80 backdrop-blur border-b border-elsai-pin/10 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-elsai-pin-dark font-bold">
          <Image src="/logo-elsai.svg" alt="" width={32} height={32} />
          <span>ELSAI</span>
        </Link>
        <div className="flex gap-4 text-sm text-elsai-ink/70 items-center">
          <button
            onClick={() => setVoiceMode((v) => !v)}
            className={`transition-colors ${voiceMode ? "text-elsai-pin font-semibold" : "hover:text-elsai-pin"}`}
            aria-pressed={voiceMode}
            title="Lecture audio automatique des réponses"
          >
            {voiceMode ? "🔊 Voix activée" : "🔈 Voix"}
          </button>
          <Link href="/scan" className="hover:text-elsai-pin transition-colors">
            Scanner un document
          </Link>
          <button
            onClick={handleForget}
            className="hover:text-elsai-urgence transition-colors"
            aria-label="Droit à l'oubli"
          >
            Tout oublier
          </button>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl w-full mx-auto"
      >
        {messages.length === 0 && (
          <div className="text-elsai-ink/80 bg-white/70 backdrop-blur border border-elsai-pin/15 rounded-organic p-5 mb-4 leading-relaxed shadow-organic">
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
        className="sticky bottom-0 bg-elsai-creme/95 backdrop-blur border-t border-elsai-pin/15 p-3"
      >
        <div className="max-w-2xl mx-auto flex gap-2 items-center">
          <VoiceRecorder onTranscription={handleVoice} disabled={loading} />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
            className="flex-1 border border-elsai-pin/20 bg-white rounded-organic px-4 py-3 focus:outline-none focus:ring-2 focus:ring-elsai-pin/60 placeholder:text-elsai-ink/40"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-elsai-pin text-elsai-creme px-6 rounded-organic shadow-organic hover:bg-elsai-pin-dark transition-colors disabled:opacity-40"
          >
            Envoyer
          </button>
        </div>
      </form>

      {emergency && (
        <EmergencyBanner cta={emergency} onClose={() => setEmergency(null)} />
      )}
    </main>
  );
}
