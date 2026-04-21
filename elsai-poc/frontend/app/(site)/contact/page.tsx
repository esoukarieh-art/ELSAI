import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";
import {
  blockList,
  blockString,
  findBlock,
  getPageContent,
} from "@/lib/pageContent";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Une question sur le projet, un partenariat, une offre entreprise, une remarque ? Écrivez-nous. ELSAI est un projet à taille humaine et chaque message est lu.",
  alternates: { canonical: "/contact" },
};

const SUJETS: { value: string; label: string }[] = [
  { value: "offre-entreprise", label: "Offre entreprises — demande de devis" },
  { value: "offre-essentiel", label: "Offre Essentiel (3 €/salarié/mois)" },
  { value: "offre-premium", label: "Offre Premium (5 €/salarié/mois)" },
  { value: "offre-sur-mesure", label: "Offre Sur mesure" },
  { value: "partenariat-institutionnel", label: "Partenariat institutionnel (CCAS, asso, collectivité)" },
  { value: "partenariat", label: "Autre partenariat" },
  { value: "presse", label: "Presse" },
  { value: "signalement", label: "Signalement d'une erreur" },
  { value: "candidature", label: "Candidature / contribution" },
  { value: "autre", label: "Autre" },
];

const MESSAGE_PRESETS: Record<string, string> = {
  "offre-entreprise":
    "Bonjour,\n\nJe souhaite recevoir des informations sur l'offre ELSAI pour les entreprises.\n\nEffectif de notre structure : \nSecteur d'activité : \nBesoin principal : \n\nMerci.",
  "offre-essentiel":
    "Bonjour,\n\nJe suis intéressé·e par l'offre Essentiel à 3 €/salarié/mois.\n\nNombre de salariés concernés : \nDate souhaitée de mise en place : \n\nMerci.",
  "offre-premium":
    "Bonjour,\n\nJe suis intéressé·e par l'offre Premium à 5 €/salarié/mois.\n\nNombre de salariés concernés : \nSites concernés : \nDate souhaitée : \n\nMerci.",
  "offre-sur-mesure":
    "Bonjour,\n\nNous sommes une structure de plus de 500 salariés et souhaitons étudier une offre sur mesure.\n\nEffectif : \nContraintes particulières (SIRH, multi-sites, etc.) : \n\nMerci.",
  "partenariat-institutionnel":
    "Bonjour,\n\nNous représentons une structure publique/associative et souhaitons explorer un partenariat avec ELSAI.\n\nStructure : \nTerritoire : \nBesoin identifié : \n\nMerci.",
};

const INPUT_CLASS =
  "rounded-organic border-elsai-pin/20 bg-white focus:border-elsai-pin focus:ring-2 focus:ring-elsai-pin/30 w-full border px-4 py-3 outline-none transition-colors";

interface LabelItem {
  label: string;
}

const FALLBACK_OFFER_ITEMS: LabelItem[] = [
  { label: "À partir de 3 € par salarié et par mois HT" },
  { label: "Anonymat total vis-à-vis de l'employeur" },
  { label: "Mise en place en moins de 2 semaines" },
  { label: "Engagement 12 mois, facturation mensuelle ou annuelle" },
];

const FALLBACK_URGENCE_ITEMS: LabelItem[] = [
  { label: "15 — SAMU" },
  { label: "17 — Police" },
  { label: "18 — Pompiers" },
  { label: "112 — Urgences UE" },
  { label: "119 — Enfance en danger" },
  { label: "3114 — Prévention du suicide" },
];

type SP = { sujet?: string; preview?: string; token?: string };

type Props = {
  searchParams?: Promise<SP> | SP;
};

export default async function Page({ searchParams }: Props) {
  const params = (searchParams ? await searchParams : undefined) ?? {};
  const sujetFromUrl = params.sujet;
  const sujetMatched = SUJETS.find((s) => s.value === sujetFromUrl)?.value ?? "autre";
  const messagePreset = sujetFromUrl ? (MESSAGE_PRESETS[sujetFromUrl] ?? "") : "";
  const isEntreprise = sujetFromUrl?.startsWith("offre-");

  const previewEnabled = params.preview === "1" && !!params.token;
  const content = await getPageContent("contact", {
    preview: previewEnabled,
    token: params.token,
  });

  const hero = findBlock(content?.blocks, "hero");
  const formNotes = findBlock(content?.blocks, "form_notes");
  const asideOffer = findBlock(content?.blocks, "aside_offer");
  const asideDifficulty = findBlock(content?.blocks, "aside_difficulty");
  const asideUrgence = findBlock(content?.blocks, "aside_urgence");

  const heroEyebrow = blockString(hero, "eyebrow", "Contact");
  const heroTitle = blockString(hero, "title", "Nous écrire.");
  const heroSubtitle = blockString(hero, "subtitle", "");

  const entrepriseTitle = blockString(
    formNotes,
    "entreprise_title",
    "Demande pré-remplie",
  );
  const entrepriseBody = blockString(
    formNotes,
    "entreprise_body",
    "Nous vous répondrons sous 48h ouvrées avec une proposition adaptée à votre effectif.",
  );
  const privacyNote = blockString(
    formNotes,
    "privacy_note",
    "En nous écrivant, vous acceptez que nous conservions votre email le temps nécessaire pour répondre.",
  );

  const offerTitle = blockString(
    asideOffer,
    "title",
    "À propos de l'offre entreprises",
  );
  const offerItems = blockList<LabelItem>(asideOffer, "items", FALLBACK_OFFER_ITEMS);
  const offerLinkLabel = blockString(
    asideOffer,
    "link_label",
    "Revoir le détail de l'offre →",
  );
  const offerLinkHref = blockString(asideOffer, "link_href", "/offre");

  const difficultyTitle = blockString(
    asideDifficulty,
    "title",
    "Vous êtes en difficulté\u00A0?",
  );
  const difficultyBody = blockString(
    asideDifficulty,
    "body",
    "Cette page n'est pas un service d'assistance. Pour une demande d'aide, rendez-vous sur le service ELSAI (/start) — anonyme et disponible 24/7.",
  );

  const urgenceTitle = blockString(asideUrgence, "title", "Urgence vitale");
  const urgenceItems = blockList<LabelItem>(
    asideUrgence,
    "items",
    FALLBACK_URGENCE_ITEMS,
  );

  return (
    <>
      {previewEnabled && (
        <div className="bg-amber-500 text-center text-xs font-semibold uppercase tracking-wider text-white">
          Mode prévisualisation — brouillon non publié
        </div>
      )}

      <PageHero eyebrow={heroEyebrow} title={heroTitle}>
        {heroSubtitle ? (
          heroSubtitle
        ) : (
          <>
            Cette page est réservée aux professionnels, partenaires, entreprises, journalistes et
            contributeurs. Pour une demande d'aide personnelle,{" "}
            <a href="/start" className="text-elsai-pin-dark underline">
              rendez-vous sur le service
            </a>
            .
          </>
        )}
      </PageHero>

      <Section>
        <div className="grid gap-10 md:grid-cols-2">
          <form
            className="space-y-4"
            action="mailto:contact@elsai.fr"
            method="post"
            encType="text/plain"
          >
            {isEntreprise && (
              <div className="rounded-organic bg-elsai-pin/5 border-elsai-pin/20 border p-4 text-sm">
                <p className="text-elsai-pin-dark font-semibold">{entrepriseTitle}</p>
                <p className="text-elsai-ink/80 mt-1">{entrepriseBody}</p>
              </div>
            )}

            <div>
              <label htmlFor="nom" className="text-elsai-ink mb-1 block text-sm font-semibold">
                Votre nom
              </label>
              <input id="nom" name="nom" required className={INPUT_CLASS} />
            </div>

            {isEntreprise && (
              <>
                <div>
                  <label htmlFor="entreprise" className="text-elsai-ink mb-1 block text-sm font-semibold">
                    Entreprise
                  </label>
                  <input id="entreprise" name="entreprise" required className={INPUT_CLASS} />
                </div>
                <div>
                  <label htmlFor="effectif" className="text-elsai-ink mb-1 block text-sm font-semibold">
                    Effectif approximatif
                  </label>
                  <select
                    id="effectif"
                    name="effectif"
                    className={INPUT_CLASS}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Choisir…
                    </option>
                    <option>Moins de 10 salariés</option>
                    <option>10 à 49 salariés</option>
                    <option>50 à 249 salariés</option>
                    <option>250 à 499 salariés</option>
                    <option>500 salariés et plus</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="text-elsai-ink mb-1 block text-sm font-semibold">
                Email professionnel
              </label>
              <input id="email" name="email" type="email" required className={INPUT_CLASS} />
            </div>

            <div>
              <label htmlFor="sujet" className="text-elsai-ink mb-1 block text-sm font-semibold">
                Sujet
              </label>
              <select
                id="sujet"
                name="sujet"
                defaultValue={sujetMatched}
                className={INPUT_CLASS}
              >
                {SUJETS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="message" className="text-elsai-ink mb-1 block text-sm font-semibold">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={isEntreprise ? 8 : 6}
                required
                defaultValue={messagePreset}
                className="rounded-organic border-elsai-pin/20 bg-elsai-creme focus:border-elsai-pin w-full resize-y border px-4 py-3 outline-none"
              />
            </div>

            <button
              type="submit"
              className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic hover:bg-elsai-pin-dark px-6 py-3.5 font-semibold"
            >
              Envoyer
            </button>
            <p className="text-elsai-ink/60 text-xs">{privacyNote}</p>
          </form>

          <aside className="space-y-6">
            {isEntreprise && (
              <div className="rounded-organic border-elsai-pin/20 bg-elsai-creme border p-6">
                <h3 className="text-elsai-pin-dark font-semibold">{offerTitle}</h3>
                <ul className="text-elsai-ink/85 mt-3 space-y-2 text-sm">
                  {offerItems.map((x, i) => (
                    <li key={`${x.label}-${i}`}>• {x.label}</li>
                  ))}
                </ul>
                {offerLinkLabel && (
                  <a
                    href={offerLinkHref || "/offre"}
                    className="text-elsai-pin-dark mt-3 inline-block text-sm font-semibold hover:underline"
                  >
                    {offerLinkLabel}
                  </a>
                )}
              </div>
            )}

            <div className="bg-elsai-rose/10 rounded-organic border-elsai-rose/20 border p-6">
              <h3 className="text-elsai-rose-dark font-semibold">{difficultyTitle}</h3>
              <p className="text-elsai-ink/80 mt-2 text-sm leading-relaxed">{difficultyBody}</p>
            </div>
            <div className="rounded-organic border-elsai-pin/10 bg-elsai-creme border p-6">
              <h3 className="text-elsai-pin-dark font-semibold">{urgenceTitle}</h3>
              <ul className="text-elsai-ink/85 mt-2 space-y-1 text-sm">
                {urgenceItems.map((x, i) => (
                  <li key={`${x.label}-${i}`}>{x.label}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
