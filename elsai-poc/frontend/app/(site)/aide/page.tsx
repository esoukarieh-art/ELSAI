import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";
import { fetchHelpPages, type PublicPostSummary } from "@/lib/content";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 60;

const TITLE = "Centre d'aide ELSAI — guide d'utilisation";
const DESCRIPTION =
  "Apprenez à utiliser ELSAI : discuter, dicter à la voix, scanner une lettre administrative, installer l'application, effacer vos données. Assistant social IA anonyme et gratuit.";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: "/aide" },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      type: "website",
      url: `${SITE_URL}/aide`,
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
    },
  };
}

const GROUPS: { key: string; title: string; description: string; slugs: string[] }[] = [
  {
    key: "demarrer",
    title: "Démarrer",
    description: "Les bases pour bien commencer avec ELSAI.",
    slugs: ["demarrer", "poser-une-question", "installer-sur-mobile"],
  },
  {
    key: "fonctionnalites",
    title: "Fonctionnalités",
    description: "Tirer le meilleur parti de la voix et du scan de documents.",
    slugs: ["parler-avec-la-voix", "scanner-un-document"],
  },
  {
    key: "confiance",
    title: "Sécurité & vie privée",
    description: "Vos droits, votre anonymat, les ressources d'urgence.",
    slugs: ["effacer-mes-donnees", "vie-privee", "securite", "faq"],
  },
];

function Card({ post }: { post: PublicPostSummary }) {
  return (
    <article className="rounded-organic border-elsai-pin/15 bg-elsai-creme hover:border-elsai-pin/40 border p-6 transition-colors">
      <h2 className="text-elsai-pin-dark font-serif text-xl leading-snug">
        <Link href={`/aide/${post.slug}`} className="hover:underline">
          {post.title}
        </Link>
      </h2>
      <p className="text-elsai-ink/80 mt-2 text-sm leading-relaxed">{post.description}</p>
      <div className="mt-3">
        <Link
          href={`/aide/${post.slug}`}
          className="text-elsai-pin-dark text-sm font-semibold hover:underline"
        >
          Lire →
        </Link>
      </div>
    </article>
  );
}

export default async function AideHubPage() {
  const posts = await fetchHelpPages({ limit: 50 });
  const bySlug = new Map(posts.map((p) => [p.slug, p]));

  const breadcrumb = [
    { name: "Accueil", url: `${SITE_URL}/` },
    { name: "Aide", url: `${SITE_URL}/aide` },
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumb.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      item: b.url,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero eyebrow="Centre d'aide" title="Comment utiliser ELSAI">
        Guides courts et concrets pour tirer le meilleur parti de votre assistant social
        anonyme. Chaque page va droit au but.
      </PageHero>

      <Section>
        {posts.length === 0 ? (
          <p className="text-elsai-ink/70">
            Le centre d'aide est en cours de rédaction. Revenez bientôt !
          </p>
        ) : (
          <div className="space-y-12">
            {GROUPS.map((group) => {
              const groupPosts = group.slugs
                .map((s) => bySlug.get(s))
                .filter((p): p is PublicPostSummary => Boolean(p));
              if (groupPosts.length === 0) return null;
              return (
                <div key={group.key}>
                  <h2 className="text-elsai-pin-dark font-serif text-2xl md:text-3xl">
                    {group.title}
                  </h2>
                  <p className="text-elsai-ink/70 mt-1 mb-5 text-sm">{group.description}</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    {groupPosts.map((p) => (
                      <Card key={p.slug} post={p} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-16 flex flex-wrap justify-center gap-3">
          <Link
            href="/start"
            className="bg-elsai-pin hover:bg-elsai-pin-dark text-elsai-creme rounded-organic inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold"
          >
            Démarrer une conversation →
          </Link>
          <Link
            href="/contact"
            className="text-elsai-pin-dark hover:bg-elsai-pin/5 rounded-organic border-elsai-pin/30 inline-flex items-center gap-2 border px-6 py-3 text-sm font-semibold"
          >
            Nous contacter
          </Link>
        </div>
      </Section>
    </>
  );
}
