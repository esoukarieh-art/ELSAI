import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Section from "@/components/site/Section";

export const metadata: Metadata = {
  title: "ELSAI — Assistant social numérique anonyme",
  description:
    "Comprends et active tes droits sociaux en France. Anonymement, sans rendez-vous, sans jugement. CAF, logement, emploi, MDPH, jeunes 12-18 ans.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ELSAI — Assistant social numérique anonyme",
    description:
      "Comprends et active tes droits sociaux en France. Anonymement, sans rendez-vous, sans jugement.",
    url: "/",
  },
};

const CAS = [
  {
    tag: "À 18 ans",
    title: "Comprendre mes droits quand je deviens majeur·e",
    body:
      "Aide pour comprendre la CAF, la sécu, le logement étudiant, les aides jeunesse.",
  },
  {
    tag: "RSA refusé",
    title: "On m'a refusé le RSA, est-ce normal\u00A0?",
    body: "On relit ensemble la lettre, on vérifie tes droits, on prépare un recours.",
  },
  {
    tag: "Ado en difficulté",
    title: "Ça ne va pas à la maison ou au collège",
    body: "Un espace anonyme pour poser des mots. Sans jugement, sans dossier.",
  },
  {
    tag: "Logement d'urgence",
    title: "Je n'ai pas où dormir ce soir",
    body: "Les numéros utiles, les démarches immédiates, les lieux près de chez toi.",
  },
];

const DIFF = [
  {
    title: "Anonyme par défaut",
    body:
      "Aucun nom, aucun email requis. Tu peux tout effacer en un clic, sans laisser de trace.",
  },
  {
    title: "Disponible 24/7, gratuit",
    body:
      "Pas de rendez-vous, pas de salle d'attente. Tu poses ta question quand tu peux.",
  },
  {
    title: "Empathique et franc",
    body:
      "On t'écoute vraiment. Et si un droit n'existe pas, on te le dit clairement — pas de faux espoirs.",
  },
  {
    title: "Droits sociaux FR + protection",
    body:
      "Spécialisé sur les dispositifs français. Pour les 12-18 ans, un protocole de sécurité avec le 119.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="bg-symbiose relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 pt-16 md:pt-24 pb-20 md:pb-28 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-elsai-pin font-semibold mb-5">
              Assistance sociale numérique
            </p>
            <h1 className="font-serif text-4xl md:text-6xl text-elsai-pin-dark tracking-tight leading-[1.05]">
              Comprends et active
              <br />
              tes droits sociaux.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-elsai-ink/80 leading-relaxed max-w-lg">
              <strong>Anonymement.</strong> Sans rendez-vous.
              <br />
              Sans jugement.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/start"
                className="inline-flex items-center gap-2 bg-elsai-pin text-elsai-creme px-6 py-4 rounded-organic text-base font-semibold shadow-organic hover:bg-elsai-pin-dark transition-colors"
              >
                Poser ma question →
              </Link>
              <Link
                href="/comment-ca-marche"
                className="inline-flex items-center px-6 py-4 rounded-organic text-base font-semibold text-elsai-pin-dark border border-elsai-pin/30 hover:bg-elsai-pin/5"
              >
                Comment ça marche
              </Link>
            </div>
            <p className="mt-6 text-sm text-elsai-ink/60 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>✓ Sans inscription</span>
              <span>✓ Hébergé en France</span>
              <span>✓ Sans cookies</span>
            </p>
          </div>

          <div className="relative flex justify-center md:justify-end">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 opacity-50"
              style={{
                background:
                  "radial-gradient(circle at 60% 40%, rgba(125,158,141,0.22), transparent 60%)",
              }}
            />
            <Image
              src="/logo-elsai.svg"
              alt=""
              width={380}
              height={380}
              priority
              fetchPriority="high"
              className="drop-shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* DIFFERENTIATEURS */}
      <Section tone="soft">
        <h2 className="font-serif text-3xl md:text-4xl text-elsai-pin-dark tracking-tight max-w-2xl">
          Un service pensé pour les personnes qu'on n'écoute pas toujours.
        </h2>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {DIFF.map((d) => (
            <div
              key={d.title}
              className="bg-elsai-creme rounded-organic p-6 shadow-organic/50 border border-elsai-pin/10"
            >
              <h3 className="font-semibold text-elsai-pin-dark text-lg mb-2">
                {d.title}
              </h3>
              <p className="text-sm text-elsai-ink/80 leading-relaxed">{d.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CAS D'USAGE */}
      <Section>
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <h2 className="font-serif text-3xl md:text-4xl text-elsai-pin-dark tracking-tight">
            À quoi ça sert concrètement&nbsp;?
          </h2>
          <Link
            href="/cas-usage"
            className="text-sm font-semibold text-elsai-pin-dark hover:underline"
          >
            Voir tous les cas d'usage →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {CAS.map((c) => (
            <article
              key={c.title}
              className="group bg-elsai-creme rounded-organic p-7 border border-elsai-pin/10 hover:border-elsai-pin/30 transition-colors"
            >
              <span className="inline-block text-xs uppercase tracking-widest font-semibold text-elsai-rose-dark bg-elsai-rose/10 px-2.5 py-1 rounded-full">
                {c.tag}
              </span>
              <h3 className="font-serif text-2xl mt-4 text-elsai-ink leading-snug">
                {c.title}
              </h3>
              <p className="mt-3 text-elsai-ink/75 leading-relaxed">{c.body}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* POUR QUI */}
      <Section tone="warm">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-elsai-creme rounded-organic p-8 border border-elsai-pin/15">
            <h3 className="font-serif text-2xl text-elsai-pin-dark">
              Pour les adultes
            </h3>
            <p className="mt-3 text-elsai-ink/80 leading-relaxed">
              CAF, impôts, logement, emploi, surendettement, MDPH… On vous parle
              clairement, sans jargon, et on vous guide étape par étape.
            </p>
            <Link
              href="/pour-qui#adultes"
              className="inline-block mt-5 text-elsai-pin-dark font-semibold hover:underline"
            >
              Votre parcours →
            </Link>
          </div>
          <div className="bg-elsai-creme rounded-organic p-8 border border-elsai-rose/30">
            <h3 className="font-serif text-2xl text-elsai-rose-dark">
              Pour les 12-18 ans
            </h3>
            <p className="mt-3 text-elsai-ink/80 leading-relaxed">
              Tes droits, l'école, la famille, ce qui va pas. On te tutoie, on
              t'écoute, et si c'est grave on t'oriente vers le 119 ou une
              Maison des Ados.
            </p>
            <Link
              href="/pour-qui#mineurs"
              className="inline-block mt-5 text-elsai-rose-dark font-semibold hover:underline"
            >
              Ton espace →
            </Link>
          </div>
        </div>
      </Section>

      {/* CTA FINAL */}
      <Section>
        <div className="bg-elsai-pin text-elsai-creme rounded-organic p-10 md:p-14 text-center shadow-organic">
          <h2 className="font-serif text-3xl md:text-4xl tracking-tight">
            Tu peux essayer tout de suite.
          </h2>
          <p className="mt-4 text-elsai-creme/90 text-lg max-w-xl mx-auto">
            Aucune inscription. Ce que tu écris s'efface en un clic.
          </p>
          <Link
            href="/start"
            className="inline-block mt-8 bg-elsai-creme text-elsai-pin-dark px-8 py-4 rounded-organic font-semibold hover:bg-white transition-colors"
          >
            Poser ma question
          </Link>
        </div>
      </Section>
    </>
  );
}
