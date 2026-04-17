"use client";

import { useEffect, useRef, useState } from "react";

import { transcribeAudio } from "@/lib/api";

interface Props {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

function pickMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
  for (const t of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

export default function VoiceRecorder({ onTranscription, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        if (blob.size < 500) {
          setError("Enregistrement trop court");
          return;
        }
        setProcessing(true);
        try {
          const text = await transcribeAudio(blob);
          if (text) onTranscription(text);
          else setError("Aucune parole détectée");
        } catch (err: any) {
          setError(err.message || "Erreur de transcription");
        } finally {
          setProcessing(false);
        }
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch (err: any) {
      setError(err.name === "NotAllowedError" ? "Accès au micro refusé" : "Micro indisponible");
    }
  }

  function stop() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  const busy = processing || disabled;
  const label = processing
    ? "Transcription…"
    : recording
      ? "Arrêter l'enregistrement"
      : "Enregistrer un message vocal";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={recording ? stop : start}
        disabled={busy && !recording}
        aria-label={label}
        title={label}
        className={`rounded-organic shadow-organic flex h-12 w-12 items-center justify-center transition-colors ${
          recording
            ? "bg-elsai-urgence animate-pulse text-white"
            : "border-elsai-pin/30 text-elsai-pin-dark hover:bg-elsai-pin/10 border bg-white"
        } disabled:opacity-40`}
      >
        {processing ? (
          <span className="border-elsai-pin h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        )}
      </button>
      {error && (
        <div className="bg-elsai-urgence absolute right-0 bottom-full mb-2 rounded px-2 py-1 text-xs whitespace-nowrap text-white">
          {error}
        </div>
      )}
    </div>
  );
}
