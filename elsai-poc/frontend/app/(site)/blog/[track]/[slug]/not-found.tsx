import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export default function NotFound() {
  return (
    <>
      <PageHero eyebrow="404" title="Article introuvable">
        Cet article n'existe plus ou a été déplacé.
      </PageHero>
      <Section>
        <Link
          href="/blog"
          className="text-elsai-pin-dark hover:bg-elsai-pin/5 rounded-organic border-elsai-pin/30 inline-flex items-center gap-2 border px-5 py-3 text-sm font-semibold"
        >
          ← Retour au journal
        </Link>
      </Section>
    </>
  );
}
