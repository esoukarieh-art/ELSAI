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
    a: "Par défaut, ta session est conservée temporairement pour que la conversation reste cohérente. Tu peux tout effacer instantanément, à n'importe quel moment. Nous ne revendons rien, jamais.",
  },
  {
    q: "Est-ce qu'ELSAI remplace un travailleur social\u00A0?",
    a: "Non. ELSAI est un premier point de contact\u00A0: il t'aide à y voir clair, à comprendre tes droits, à préparer une démarche. Pour un accompagnement approfondi, un humain (CCAS, France Services, assistante sociale) reste indispensable.",
  },
  {
    q: "Est-ce fiable\u00A0? Comment savoir si l'info est juste\u00A0?",
    a: "ELSAI s'appuie sur des sources officielles françaises (service-public.fr, CAF, CNAM, Légifrance). En cas de doute, il te dit «\u00A0je ne suis pas sûr\u00A0» et t'oriente vers la source humaine adaptée.",
  },
  {
    q: "J'ai moins de 18 ans, est-ce que mes parents peuvent savoir\u00A0?",
    a: "Non. ELSAI est anonyme, même pour les mineurs. Seule exception\u00A0: si tu es en danger grave, nous t'orienterons fermement vers le 119 — mais ce sont eux qui gèrent le relais, pas nous.",
  },
  {
    q: "Et si je veux parler à un humain\u00A0?",
    a: "ELSAI te donne les coordonnées du CCAS, de France Services ou de l'association la plus proche de chez toi. Il peut aussi t'aider à appeler un numéro d'urgence si tu le souhaites.",
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
        Pas la réponse que tu cherches&nbsp;? <a href="/contact" className="underline text-elsai-pin-dark">Écris-nous</a>.
      </PageHero>

      <Section>
        <div className="mx-auto max-w-3xl space-y-3">
          {FAQ.map((f, i) => (
            <details
              key={i}
              className="group rounded-organic border border-elsai-pin/10 bg-elsai-creme px-6 py-4 open:shadow-organic"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold text-elsai-pin-dark">
                <span>{f.q}</span>
                <span
                  aria-hidden
                  className="text-xl text-elsai-pin transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 leading-relaxed text-elsai-ink/80">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  );
}
