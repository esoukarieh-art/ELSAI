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
    <main className="bg-symbiose flex min-h-screen flex-col items-center justify-center p-6 text-center">
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

        <h1 className="text-elsai-pin-dark mb-3 font-serif text-4xl tracking-tight md:text-5xl">
          ELSAI
        </h1>
        <p className="text-elsai-ink/80 mb-12 text-lg leading-relaxed">
          Une permanence d'accueil numérique,
          <br />
          anonyme et disponible&nbsp;24h/24.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => start("adult")}
            className="elsai-breathe rounded-organic bg-elsai-pin text-elsai-creme shadow-organic hover:bg-elsai-pin-dark w-full py-5 text-xl font-semibold transition-colors"
          >
            J'ai une question
          </button>
          <button
            onClick={() => start("adult")}
            className="rounded-organic bg-elsai-pin/90 text-elsai-creme shadow-organic hover:bg-elsai-pin-dark w-full py-5 text-xl font-semibold transition-colors"
          >
            J'ai besoin d'un conseil
          </button>
          <button
            onClick={() => start("adult")}
            className="rounded-organic bg-elsai-pin/80 text-elsai-creme shadow-organic hover:bg-elsai-pin-dark w-full py-5 text-xl font-semibold transition-colors"
          >
            J'ai besoin d'aide
          </button>
          <button
            onClick={() => start("minor")}
            className="elsai-breathe rounded-organic bg-elsai-rose text-elsai-creme shadow-warm hover:bg-elsai-rose-dark w-full py-5 text-xl font-semibold transition-colors"
          >
            J'ai entre 12 et 18 ans
          </button>
        </div>

        <div className="text-elsai-ink/60 mt-12 space-y-2 text-sm">
          <p className="flex items-center justify-center gap-2">
            <span className="bg-elsai-pin inline-block h-1.5 w-1.5 rounded-full" />
            Aucun nom demandé
            <span className="bg-elsai-rose inline-block h-1.5 w-1.5 rounded-full" />
            Aucun fichier conservé
          </p>
          <Link
            href="/dashboard"
            className="hover:text-elsai-pin inline-block pt-2 underline transition-colors"
          >
            Tableau de bord du POC →
          </Link>
        </div>
      </div>
    </main>
  );
}
