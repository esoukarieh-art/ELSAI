import { Suspense } from "react";
import PageHero from "@/components/site/PageHero";
import AdminContent from "./AdminContent";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<PageHero eyebrow="Espace admin" title="Chargement…" />}>
      <AdminContent />
    </Suspense>
  );
}
