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
        }
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
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-symbiose">
      <div className="max-w-xl w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logo-elsai.svg"
            alt="ELSAI"
            width={140}
            height={140}
            priority
            className="drop-shadow-sm"
          />
        </div>

        <h1 className="text-4xl md:text-5xl font-serif text-elsai-pin-dark mb-3 tracking-tight">
          ELSAI
        </h1>
        <p className="text-lg text-elsai-ink/80 mb-12 leading-relaxed">
          Une permanence d'accueil numérique,
          <br />
          anonyme et disponible&nbsp;24h/24.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => start("adult")}
            className="elsai-breathe w-full py-5 bg-elsai-pin text-elsai-creme rounded-organic text-xl font-semibold shadow-organic hover:bg-elsai-pin-dark transition-colors"
          >
            J'ai besoin d'aide
          </button>
          <button
            onClick={() => start("minor")}
            className="elsai-breathe w-full py-5 bg-elsai-rose text-elsai-creme rounded-organic text-xl font-semibold shadow-warm hover:bg-elsai-rose-dark transition-colors"
          >
            J'ai entre 12 et 18 ans
          </button>
        </div>

        <div className="mt-12 text-sm text-elsai-ink/60 space-y-2">
          <p className="flex items-center justify-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-elsai-pin" />
            Aucun nom demandé
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-elsai-rose" />
            Aucun fichier conservé
          </p>
          <Link
            href="/dashboard"
            className="underline hover:text-elsai-pin transition-colors inline-block pt-2"
          >
            Tableau de bord du POC →
          </Link>
        </div>
      </div>
    </main>
  );
}
