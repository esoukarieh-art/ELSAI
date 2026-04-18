"use client";

import { LetterTemplateLibrary } from "@/components/LetterTemplateLibrary";

export default function AdminCourriersPage() {
  return (
    <div>
      <h1 className="text-elsai-pin-dark mb-2 font-serif text-3xl">Courriers types</h1>
      <p className="text-elsai-ink/70 mb-4 text-sm leading-relaxed">
        Ajoutez, modifiez ou supprimez les modèles proposés aux utilisateurs. Vous pouvez en
        générer un brouillon avec l'IA puis l'ajuster avant publication.
      </p>
      <LetterTemplateLibrary />
    </div>
  );
}
