import type { Metadata } from "next";
import Link from "next/link";
import Section from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Sécurité & vie privée — ESLAÏ",
  description:
    "Comment ESLAÏ protège vos conversations : anonymat par défaut, droit à l'oubli en 1 clic, hébergement français, jamais de profilage. Schéma technique du flux de données.",
  alternates: { canonical: "/securite" },
};

export default function SecuritePage() {
  return (
    <>
      <section className="bg-symbiose">
        <div className="mx-auto max-w-4xl px-4 py-14 md:py-20">
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
            Sécurité & vie privée
          </p>
          <h1 className="text-elsai-pin-dark mt-3 font-serif text-4xl leading-tight md:text-6xl">
            Vos données sont à vous. Toujours.
          </h1>
          <p className="text-elsai-ink/80 mt-5 text-lg leading-relaxed">
            ESLAÏ est conçu pour ne pas savoir qui vous êtes. Pas d'email, pas de compte
            obligatoire, pas de cookies de tracking. Et un bouton <strong>« Effacer »</strong> qui
            supprime tout en moins d'une seconde.
          </p>
        </div>
      </section>

      {/* SCHEMA */}
      <Section tone="soft">
        <h2 className="text-elsai-pin-dark font-serif text-3xl tracking-tight md:text-4xl">
          Le parcours de vos données, étape par étape
        </h2>
        <p className="text-elsai-ink/70 mt-3 max-w-3xl">
          Du moment où vous tapez votre question jusqu'à sa suppression, voici ce qui se passe
          vraiment.
        </p>

        <div className="mt-10">
          <FlowDiagram />
        </div>

        <ol className="mt-10 grid gap-5 md:grid-cols-2">
          <FlowStep
            n={1}
            title="Vous arrivez sur ESLAÏ"
            body="Une session anonyme est créée automatiquement (un identifiant aléatoire). Aucun nom, aucun email, aucune adresse IP n'est stockée. Aucun cookie publicitaire."
          />
          <FlowStep
            n={2}
            title="Vous écrivez ou parlez"
            body="Votre message est chiffré en transit (HTTPS/TLS). Côté serveur, il est stocké chiffré au repos, dans une base de données hébergée en France."
          />
          <FlowStep
            n={3}
            title="L'IA répond"
            body="Le contenu de votre message est envoyé à un modèle Claude (Anthropic) avec un contrat strict : aucune réutilisation pour entraîner d'IA, aucun profil d'utilisateur."
          />
          <FlowStep
            n={4}
            title="Vous cliquez « Effacer »"
            body="Toutes vos conversations et messages sont supprimés en cascade de la base, immédiatement. Un audit log anonymisé garde une trace de l'action — jamais du contenu."
          />
        </ol>
      </Section>

      {/* COMPARATIF */}
      <Section>
        <h2 className="text-elsai-pin-dark font-serif text-3xl tracking-tight md:text-4xl">
          ESLAÏ vs un assistant IA grand public
        </h2>
        <p className="text-elsai-ink/70 mt-3 max-w-3xl">
          Pourquoi vous ne devriez pas raconter votre situation sociale à ChatGPT, Gemini ou un
          autre assistant généraliste.
        </p>

        <div className="rounded-organic border-elsai-pin/15 mt-8 overflow-hidden border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-elsai-pin/10 text-elsai-pin-dark text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Critère</th>
                <th className="px-4 py-3 font-semibold">ESLAÏ</th>
                <th className="px-4 py-3 font-semibold">IA grand public</th>
              </tr>
            </thead>
            <tbody className="divide-elsai-pin/10 divide-y">
              <Row label="Compte / email obligatoire" a="Non, jamais" b="Oui (téléphone parfois)" />
              <Row
                label="Hébergement des données"
                a="France (UE, RGPD strict)"
                b="USA principalement"
              />
              <Row
                label="Réutilisation pour entraînement IA"
                a="Interdit contractuellement"
                b="Souvent par défaut, opt-out à activer"
              />
              <Row
                label="Profilage publicitaire"
                a="Aucun, pas d'annonceur"
                b="Variable, écosystème payant"
              />
              <Row
                label="Suppression complète des conversations"
                a="1 clic, immédiat, irrévocable"
                b="Délais de rétention, copies de sauvegarde"
              />
              <Row
                label="Spécialité droit social français"
                a="Conçu pour, par une assistante sociale"
                b="Généraliste, sources variables"
              />
              <Row
                label="Détection mineur en danger → 119"
                a="Oui, automatique"
                b="Non spécifique"
              />
            </tbody>
          </table>
        </div>
      </Section>

      {/* DETAILS TECHNIQUES */}
      <Section tone="warm">
        <h2 className="text-elsai-pin-dark font-serif text-3xl tracking-tight md:text-4xl">
          Pour aller plus loin
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Detail
            title="Aucune donnée d'identification"
            body="Nous ne demandons jamais votre nom, votre adresse, votre numéro de sécurité sociale ou votre numéro CAF. Les conversations sont rattachées à un identifiant de session aléatoire, pas à votre identité."
          />
          <Detail
            title="Audit log anonymisé"
            body="Quand vous effacez vos données, nous gardons une trace technique : « action suppression à telle date, sur telle session anonyme ». Jamais le contenu de ce qui a été supprimé."
          />
          <Detail
            title="Sous-traitants minimalistes"
            body="Anthropic (LLM, USA, contrat sans réutilisation), un hébergeur français (stockage), un service mail transactionnel (uniquement pour le B2B). Liste complète sur la page Confidentialité."
          />
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/confidentialite"
            className="rounded-organic border-elsai-pin/30 text-elsai-pin-dark hover:bg-elsai-pin/5 inline-flex items-center border px-6 py-3 font-semibold"
          >
            Politique de confidentialité complète →
          </Link>
          <Link
            href="/ethique"
            className="rounded-organic border-elsai-pin/30 text-elsai-pin-dark hover:bg-elsai-pin/5 inline-flex items-center border px-6 py-3 font-semibold"
          >
            Notre charte éthique →
          </Link>
          <Link
            href="/start"
            className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic hover:bg-elsai-pin-dark inline-flex items-center px-6 py-3 font-semibold"
          >
            Poser ma question →
          </Link>
        </div>
      </Section>
    </>
  );
}

function Row({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <tr>
      <td className="text-elsai-ink/80 px-4 py-3 font-medium">{label}</td>
      <td className="text-elsai-pin-dark px-4 py-3 font-semibold">{a}</td>
      <td className="text-elsai-ink/60 px-4 py-3">{b}</td>
    </tr>
  );
}

function FlowStep({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="rounded-organic border-elsai-pin/15 bg-elsai-creme border p-6">
      <div className="bg-elsai-pin text-elsai-creme mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
        {n}
      </div>
      <h3 className="text-elsai-pin-dark font-serif text-xl">{title}</h3>
      <p className="text-elsai-ink/80 mt-2 text-sm leading-relaxed">{body}</p>
    </li>
  );
}

function Detail({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-organic border-elsai-pin/15 bg-elsai-creme border p-6">
      <h3 className="text-elsai-pin-dark font-semibold">{title}</h3>
      <p className="text-elsai-ink/75 mt-2 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

function FlowDiagram() {
  return (
    <div
      role="img"
      aria-label="Schéma du flux de données : votre question est chiffrée, traitée par un modèle IA sans réutilisation, stockée en France, et peut être effacée en un clic."
      className="rounded-organic border-elsai-pin/15 bg-elsai-creme overflow-x-auto border p-6"
    >
      <svg
        viewBox="0 0 880 260"
        className="mx-auto h-auto w-full max-w-[860px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#5A7E6B" />
          </marker>
        </defs>

        {/* Boxes */}
        <Box x={20} y={90} w={150} label="Vous" sub="anonyme" />
        <Box x={210} y={90} w={170} label="Session UUID" sub="aucun email/IP" />
        <Box x={420} y={90} w={170} label="Stockage chiffré" sub="France 🇫🇷" />
        <Box x={630} y={90} w={170} label="LLM Claude" sub="sans réentraînement" />

        {/* Arrows */}
        <Arrow x1={170} y1={120} x2={210} y2={120} />
        <Arrow x1={380} y1={120} x2={420} y2={120} />
        <Arrow x1={590} y1={120} x2={630} y2={120} />

        {/* Forget cascade */}
        <text x={420} y={210} textAnchor="middle" fontSize="13" fontWeight="600" fill="#9B7F7F">
          🗑️ Bouton « Effacer » → cascade DELETE conversations + messages
        </text>
        <Arrow x1={500} y1={170} x2={500} y2={195} dashed />
        <Arrow x1={290} y1={170} x2={420} y2={195} dashed />
        <Arrow x1={700} y1={170} x2={550} y2={195} dashed />

        <text x={20} y={30} fontSize="13" fill="#3F5A4E" fontWeight="600">
          Flux d'une question (chiffré HTTPS de bout en bout)
        </text>
      </svg>
    </div>
  );
}

function Box({
  x,
  y,
  w,
  label,
  sub,
}: {
  x: number;
  y: number;
  w: number;
  label: string;
  sub: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={70}
        rx={14}
        ry={14}
        fill="#F5F5ED"
        stroke="#5A7E6B"
        strokeWidth={1.5}
      />
      <text
        x={x + w / 2}
        y={y + 30}
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fill="#3F5A4E"
      >
        {label}
      </text>
      <text x={x + w / 2} y={y + 50} textAnchor="middle" fontSize="11" fill="#7A8C82">
        {sub}
      </text>
    </g>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  dashed = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dashed?: boolean;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="#5A7E6B"
      strokeWidth={1.8}
      markerEnd="url(#arrow)"
      strokeDasharray={dashed ? "4 4" : undefined}
    />
  );
}
