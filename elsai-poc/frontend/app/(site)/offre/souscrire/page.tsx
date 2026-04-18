import { Suspense } from "react";
import PageHero from "@/components/site/PageHero";
import SouscrireContent from "./SouscrireContent";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<PageHero eyebrow="Souscription" title="Chargement…" />}>
      <SouscrireContent />
    </Suspense>
  );
}
