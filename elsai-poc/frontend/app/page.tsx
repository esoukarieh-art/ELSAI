"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ensureSession, setSession } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();

  async function start(profile: "adult" | "minor") {
    // Reset éventuelle session existante pour choisir le profil
    sessionStorage.clear();
    try {
      // Pré-crée une session avec le bon profil
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/session`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile }),
        }
      );
      if (!res.ok) throw new Error("Session refusée");
      const data = await res.json();
      setSession(data.token, data.session_id, data.profile);
      router.push("/chat");
    } catch (err) {
      alert("Le serveur ELSAI n'est pas joignable. Vérifiez qu'il est démarré.");
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-xl w-full">
        <h1 className="text-4xl md:text-5xl font-bold text-elsai-primary mb-4">
          ELSAI
        </h1>
        <p className="text-lg text-gray-700 mb-10">
          Une permanence d'accueil numérique,
          <br />
          anonyme et disponible 24h/24.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => start("adult")}
            className="w-full py-5 bg-elsai-primary text-white rounded-xl text-xl font-semibold hover:bg-blue-900 transition"
          >
            J'ai besoin d'aide
          </button>
          <button
            onClick={() => start("minor")}
            className="w-full py-5 bg-elsai-accent text-white rounded-xl text-xl font-semibold hover:bg-amber-600 transition"
          >
            J'ai entre 12 et 18 ans
          </button>
        </div>

        <div className="mt-10 text-sm text-gray-500 space-y-2">
          <p>Aucun nom demandé · Aucun fichier conservé après la session.</p>
          <Link href="/dashboard" className="underline hover:text-elsai-primary">
            Tableau de bord du POC →
          </Link>
        </div>
      </div>
    </main>
  );
}
