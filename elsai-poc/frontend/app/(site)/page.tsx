import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Section from "@/components/site/Section";

export const metadata: Metadata = {
  title: "ELSAI — Service social numérique de premier accueil",
  description:
    "Assistant social numérique qui répond à vos questions administratives, sociales, familiales ou juridiques. Anonymement, sans rendez-vous, sans jugement. CAF, logement, emploi, MDPH, jeunes 12-18 ans.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ELSAI — Service social numérique de premier accueil",
    description:
      "Assistant social numérique qui répond à vos questions administratives, sociales, familiales ou juridiques. Anonymement, sans rendez-vous, sans jugement.",
    url: "/",
  },
};

const CAS = [
  {
    tag: "À 18 ans",
    title: "Comprendre mes droits quand je deviens majeur·e",
    body: "Aide pour comprendre la CAF, la sécu, le logement étudiant, les aides jeunesse.",
  },
  {
    tag: "RSA refusé",
    title: "On m'a refusé le RSA, est-ce normal\u00A0?",
    body: "On relit ensemble la lettre, on vérifie vos droits, on prépare un recours.",
  },
  {
    tag: "Ado en difficulté",
    title: "Ça ne va pas à la maison ou au collège",
    body: "Un espace anonyme pour poser des mots. Sans jugement, sans dossier.",
  },
  {
    tag: "Logement d'urgence",
    title: "Je n'ai pas où dormir ce soir",
    body: "Les numéros utiles, les démarches immédiates, les lieux près de chez vous.",
  },
];

const DIFF = [
  {
    title: "Anonyme par défaut",
    body: "Aucun nom, aucun email requis. Vous pouvez tout effacer en un clic, sans laisser de trace.",
  },
  {
    title: "Sans rendez-vous, sans déplacement",
    body: "Pour une question simple ou un conseil, pas besoin de prendre rendez-vous ni de vous déplacer. Vous posez votre question quand vous pouvez, d'où vous voulez.",
  },
  {
    title: "Sans le regard de l'autre",
    body: "Certaines situations sont difficiles à formuler en face d'un professionnel. Ici, vous pouvez prendre le temps, sans être jugé·e, sans avoir à justifier.",
  },
  {
    title: "Empathique et franc",
    body: "On vous écoute vraiment. Et si un droit n'existe pas, on vous le dit clairement — pas de faux espoirs.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="bg-symbiose relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-16 pb-20 md:grid-cols-2 md:pt-24 md:pb-28">
          <div>
            <p className="text-elsai-pin mb-5 text-xs font-semibold tracking-[0.2em] uppercase">
              Service social numérique de premier accueil
            </p>
            <h1 className="text-elsai-pin-dark font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl">
              Assistant social numérique
            </h1>
            <p className="text-elsai-ink mt-6 max-w-xl text-xl leading-relaxed md:text-2xl">
              Répond à toutes vos questions administratives, sociales, familiales ou juridiques et
              vous oriente vers le bon interlocuteur si besoin.
            </p>
            <p className="text-elsai-ink/80 mt-5 max-w-lg text-lg leading-relaxed">
              <strong>Anonymement.</strong> Sans rendez-vous. Sans jugement.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/start"
                className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic hover:bg-elsai-pin-dark inline-flex items-center gap-2 px-6 py-4 text-base font-semibold transition-colors"
              >
                Poser ma question →
              </Link>
              <Link
                href="/comment-ca-marche"
                className="rounded-organic border-elsai-pin/30 text-elsai-pin-dark hover:bg-elsai-pin/5 inline-flex items-center border px-6 py-4 text-base font-semibold"
              >
                Comment ça marche
              </Link>
            </div>
            <p className="text-elsai-ink/60 mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
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
        <h2 className="text-elsai-pin-dark max-w-3xl font-serif text-3xl tracking-tight md:text-4xl">
          Un service accessible 24h/24, créé par une assistante sociale diplômée.
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {DIFF.map((d) => (
            <div
              key={d.title}
              className="shadow-organic/50 rounded-organic border-elsai-pin/10 bg-elsai-creme border p-6"
            >
              <h3 className="text-elsai-pin-dark mb-2 text-lg font-semibold">{d.title}</h3>
              <p className="text-elsai-ink/80 text-sm leading-relaxed">{d.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CAS D'USAGE */}
      <Section>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-elsai-pin-dark font-serif text-3xl tracking-tight md:text-4xl">
            À quoi ça sert concrètement&nbsp;?
          </h2>
          <Link
            href="/exemples-concrets"
            className="text-elsai-pin-dark text-sm font-semibold hover:underline"
          >
            Voir tous les exemples →
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {CAS.map((c) => (
            <article
              key={c.title}
              className="group rounded-organic border-elsai-pin/10 bg-elsai-creme hover:border-elsai-pin/30 border p-7 transition-colors"
            >
              <span className="bg-elsai-rose/10 text-elsai-rose-dark inline-block rounded-full px-2.5 py-1 text-xs font-semibold tracking-widest uppercase">
                {c.tag}
              </span>
              <h3 className="text-elsai-ink mt-4 font-serif text-2xl leading-snug">{c.title}</h3>
              <p className="text-elsai-ink/75 mt-3 leading-relaxed">{c.body}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* POUR QUI */}
      <Section tone="warm">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-organic border-elsai-pin/15 bg-elsai-creme border p-8">
            <h3 className="text-elsai-pin-dark font-serif text-2xl">Pour les adultes</h3>
            <p className="text-elsai-ink/80 mt-3 leading-relaxed">
              CAF, impôts, logement, emploi, surendettement, MDPH… On vous parle clairement, sans
              jargon, et on vous guide étape par étape.
            </p>
            <Link
              href="/pour-qui#adultes"
              className="text-elsai-pin-dark mt-5 inline-block font-semibold hover:underline"
            >
              Votre parcours →
            </Link>
          </div>
          <div className="rounded-organic border-elsai-rose/30 bg-elsai-creme border p-8">
            <h3 className="text-elsai-rose-dark font-serif text-2xl">Pour les 12-18 ans</h3>
            <p className="text-elsai-ink/80 mt-3 leading-relaxed">
              Vos droits, l'école, la famille, ce qui ne va pas. On vous écoute, et si vous
              préférez qu'on vous tutoie, il suffit de le dire. Si c'est grave, on vous oriente
              vers le 119 ou une Maison des Ados.
            </p>
            <Link
              href="/pour-qui#mineurs"
              className="text-elsai-rose-dark mt-5 inline-block font-semibold hover:underline"
            >
              Votre espace →
            </Link>
          </div>
        </div>
      </Section>

      {/* CTA FINAL */}
      <Section>
        <div className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic p-10 text-center md:p-14">
          <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
            Vous pouvez tester ce service gratuitement.
          </h2>
          <p className="text-elsai-creme/90 mx-auto mt-4 max-w-xl text-lg">
            Sans aucune inscription. Ce que vous écrivez peut s'effacer en un clic.
          </p>
          <Link
            href="/start"
            className="rounded-organic bg-elsai-creme text-elsai-pin-dark mt-8 inline-block px-8 py-4 font-semibold transition-colors hover:bg-white"
          >
            Poser ma question
          </Link>
        </div>
      </Section>
    </>
  );
}
