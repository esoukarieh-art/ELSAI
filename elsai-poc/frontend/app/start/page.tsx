"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setSession } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();

  async function start(profile: "adult" | "minor") {
    sessionStorage.clear();
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/session`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile }),
        },
      );
      if (!res.ok) throw new Error("Session refusée");
      const data = await res.json();
      setSession(data.token, data.session_id, data.profile);
      router.push("/chat");
    } catch {
      alert("Le serveur ELSAI n'est pas joignable. Vérifiez qu'il est démarré.");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-symbiose p-6 text-center">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/logo-elsai.svg"
            alt="ELSAI"
            width={140}
            height={140}
            priority
            className="drop-shadow-sm"
          />
        </div>

        <h1 className="mb-3 font-serif text-4xl tracking-tight text-elsai-pin-dark md:text-5xl">
          ELSAI
        </h1>
        <p className="mb-12 text-lg leading-relaxed text-elsai-ink/80">
          Une permanence d'accueil numérique,
          <br />
          anonyme et disponible&nbsp;24h/24.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => start("adult")}
            className="elsai-breathe w-full rounded-organic bg-elsai-pin py-5 text-xl font-semibold text-elsai-creme shadow-organic transition-colors hover:bg-elsai-pin-dark"
          >
            J'ai besoin d'aide
          </button>
          <button
            onClick={() => start("minor")}
            className="elsai-breathe w-full rounded-organic bg-elsai-rose py-5 text-xl font-semibold text-elsai-creme shadow-warm transition-colors hover:bg-elsai-rose-dark"
          >
            J'ai entre 12 et 18 ans
          </button>
        </div>

        <div className="mt-12 space-y-2 text-sm text-elsai-ink/60">
          <p className="flex items-center justify-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-elsai-pin" />
            Aucun nom demandé
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-elsai-rose" />
            Aucun fichier conservé
          </p>
          <Link
            href="/dashboard"
            className="inline-block pt-2 underline transition-colors hover:text-elsai-pin"
          >
            Tableau de bord du POC →
          </Link>
        </div>
      </div>
    </main>
  );
}
