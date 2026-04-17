import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

const FAQ = [
  {
    q: "ELSAI, c'est gratuit ?",
    a: "Oui, totalement. ELSAI est un projet d'intérêt général, sans publicité, sans abonnement, sans vente de données.",
  },
  {
    q: "Est-ce que vous gardez ce que j'écris ?",
    a: "Par défaut, ta session est conservée temporairement pour que la conversation reste cohérente. Tu peux tout effacer instantanément, à n'importe quel moment. Nous ne revendons rien, jamais.",
  },
  {
    q: "Est-ce que ELSAI remplace un travailleur social ?",
    a: "Non. ELSAI est un premier point de contact : il t'aide à y voir clair, à comprendre tes droits, à préparer une démarche. Pour un accompagnement approfondi, un humain (CCAS, France Services, assistante sociale) reste indispensable.",
  },
  {
    q: "Est-ce fiable ? Comment savoir si l'info est juste ?",
    a: "ELSAI s'appuie sur des sources officielles françaises (service-public.fr, CAF, CNAM, légifrance). En cas de doute, il te dit « je ne suis pas sûr » et t'oriente vers la source humaine adaptée.",
  },
  {
    q: "J'ai moins de 18 ans, est-ce que mes parents peuvent savoir ?",
    a: "Non. ELSAI est anonyme, même pour les mineurs. Les seules exceptions : si tu es en danger grave, nous t'orienterons fermement vers le 119 — mais ce sont eux qui gèrent le relais, pas nous.",
  },
  {
    q: "Et si je veux parler à un humain ?",
    a: "ELSAI te donne les coordonnées du CCAS, du France Services, ou de l'association la plus proche de chez toi. Il peut aussi appeler à ta place si tu le souhaites (numéros d'urgence).",
  },
  {
    q: "Qui est derrière ELSAI ?",
    a: "Un collectif d'acteurs du travail social et du numérique d'intérêt général. Plus d'infos sur la page Partenariats ou en écrivant via la page Contact.",
  },
  {
    q: "Et les langues autres que le français ?",
    a: "La V1 est en français uniquement. Des versions simplifiées (FALC) et multilingues sont prévues pour les versions suivantes.",
  },
];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="FAQ" title="Les questions qu'on nous pose.">
        Pas la réponse que tu cherches ?{" "}
        <a href="/contact" className="text-elsai-pin-dark underline">
          Écris-nous
        </a>
        .
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
