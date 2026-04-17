"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import ChatBubble from "@/components/ChatBubble";
import EmergencyBanner from "@/components/EmergencyBanner";
import VoiceRecorder from "@/components/VoiceRecorder";
import { ForgetButton } from "@/components/ForgetButton";
import { getProfile, sendMessage, synthesizeSpeech } from "@/lib/api";

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
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ Erreur : ${err.message}` }]);
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

  const placeholder =
    profile === "minor" ? "Posez votre question librement…" : "Décrivez votre situation…";
  const intro =
    profile === "minor"
      ? "Bonjour, je suis ELSAI. Vous pouvez me poser n'importe quelle question, c'est confidentiel. Si vous préférez qu'on se tutoie, dites-le moi."
      : "Bonjour, je suis ELSAI. Décrivez votre situation, je vais essayer de vous aider.";

  const accentBar = profile === "minor" ? "bg-elsai-rose" : "bg-elsai-pin";

  return (
    <main className="flex min-h-screen flex-col">
      {/* Bande d'accent selon profil */}
      <div className={`h-1 w-full ${accentBar}`} />

      <header className="border-elsai-pin/10 flex items-center justify-between border-b bg-white/80 px-4 py-3 backdrop-blur">
        <Link href="/" className="text-elsai-pin-dark flex items-center gap-2 font-bold">
          <Image src="/logo-elsai.svg" alt="" width={32} height={32} />
          <span>ELSAI</span>
        </Link>
        <div className="text-elsai-ink/70 flex items-center gap-4 text-sm">
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
          <ForgetButton />
        </div>
      </header>

      <div ref={scrollRef} className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="rounded-organic border-elsai-pin/15 text-elsai-ink/80 shadow-organic mb-4 border bg-white/70 p-5 leading-relaxed backdrop-blur">
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
        className="border-elsai-pin/15 bg-elsai-creme/95 sticky bottom-0 border-t p-3 backdrop-blur"
      >
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <VoiceRecorder onTranscription={handleVoice} disabled={loading} />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
            className="rounded-organic border-elsai-pin/20 placeholder:text-elsai-ink/40 focus:ring-elsai-pin/60 flex-1 border bg-white px-4 py-3 focus:ring-2 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic hover:bg-elsai-pin-dark px-6 transition-colors disabled:opacity-40"
          >
            Envoyer
          </button>
        </div>
      </form>

      {emergency && <EmergencyBanner cta={emergency} onClose={() => setEmergency(null)} />}
    </main>
  );
}
