import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Questions fréquentes",
  description:
    "Réponses aux questions fréquentes sur ELSAI : anonymat, fiabilité des réponses, données personnelles, situations d'urgence, accompagnement humain.",
  alternates: { canonical: "/faq" },
};

const FAQ = [
  {
    q: "ELSAI, c'est gratuit\u00A0?",
    a: "Oui, totalement. ELSAI est un projet d'intérêt général, sans publicité, sans abonnement, sans vente de données.",
  },
  {
    q: "Est-ce que vous gardez ce que j'écris\u00A0?",
    a: "Par défaut, votre session est conservée temporairement pour que la conversation reste cohérente. Vous pouvez tout effacer instantanément, à n'importe quel moment. Nous ne revendons rien, jamais.",
  },
  {
    q: "Est-ce qu'ELSAI remplace un travailleur social\u00A0?",
    a: "Non. ELSAI est un premier point de contact\u00A0: il vous aide à y voir clair, à comprendre vos droits, à préparer une démarche. Pour un accompagnement approfondi, un humain (CCAS, France Services, assistante sociale) reste indispensable.",
  },
  {
    q: "Est-ce fiable\u00A0? Comment savoir si l'info est juste\u00A0?",
    a: "ELSAI s'appuie sur des sources officielles françaises (service-public.fr, CAF, CNAM, Légifrance). En cas de doute, il vous dit «\u00A0je ne suis pas sûr\u00A0» et vous oriente vers la source humaine adaptée.",
  },
  {
    q: "J'ai moins de 18 ans, est-ce que mes parents peuvent savoir\u00A0?",
    a: "Non. ELSAI est anonyme, même pour les mineurs. Seule exception\u00A0: si vous êtes en danger grave, nous vous orienterons fermement vers le 119 — mais ce sont eux qui gèrent le relais, pas nous.",
  },
  {
    q: "Et si je veux parler à un humain\u00A0?",
    a: "ELSAI vous donne les coordonnées du CCAS, de France Services ou de l'association la plus proche de chez vous. Il peut aussi vous aider à appeler un numéro d'urgence si vous le souhaitez.",
  },
  {
    q: "Qui est derrière ELSAI\u00A0?",
    a: "Un collectif d'acteurs du travail social et du numérique d'intérêt général. Plus d'infos sur la page Partenariats, ou en nous écrivant via la page Contact.",
  },
  {
    q: "Et les langues autres que le français\u00A0?",
    a: "La V1 est en français uniquement. Des versions simplifiées (FALC) et multilingues sont prévues pour les versions suivantes.",
  },
];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="FAQ" title="Les questions qu'on nous pose.">
        Pas la réponse que vous cherchez&nbsp;?{" "}
        <a href="/contact" className="text-elsai-pin-dark underline">
          Écrivez-nous
        </a>
        .
      </PageHero>

      <Section>
        <div className="mx-auto max-w-3xl space-y-3">
          {FAQ.map((f, i) => (
            <details
              key={i}
              className="group rounded-organic border-elsai-pin/10 bg-elsai-creme open:shadow-organic border px-6 py-4"
            >
              <summary className="text-elsai-pin-dark flex cursor-pointer list-none items-start justify-between gap-4 font-semibold">
                <span>{f.q}</span>
                <span
                  aria-hidden
                  className="text-elsai-pin text-xl transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="text-elsai-ink/80 mt-3 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  );
}
