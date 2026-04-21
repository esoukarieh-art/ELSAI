/**
 * Règles d'auto-injection de CTA d'urgence / engagement en fonction
 * de l'audience + tags + CTAs déjà attachés à l'article.
 */

export interface ExistingCTA {
  cta_key: string;
  position: "top" | "inline" | "end" | "sticky";
}

export interface AutoInjectInput {
  post: {
    tags: string[];
    audience: string;
    body?: string;
  };
  existingCTAs?: ExistingCTA[];
}

export interface InjectedCTA {
  blockKey: string;
  position: "top" | "inline" | "end";
}

const has = (tags: string[], needle: string): boolean =>
  tags.some((t) => t.toLowerCase().includes(needle.toLowerCase()));

export function computeAutoInjectedCTAs(input: AutoInjectInput): InjectedCTA[] {
  const { post } = input;
  const existing = input.existingCTAs ?? [];
  const tags = post.tags ?? [];
  const result: InjectedCTA[] = [];

  const alreadyHas = (key: string) => existing.some((c) => c.cta_key === key);
  const hasEndCTA = existing.some((c) => c.position === "end");

  // 1) Mineurs + violence/danger → 119
  if (
    post.audience === "minor" &&
    (has(tags, "violence") || has(tags, "danger")) &&
    !alreadyHas("urgence_119")
  ) {
    result.push({ blockKey: "urgence_119", position: "top" });
  }

  // 2) Adulte + violences conjugales → 3919
  if (
    post.audience === "adult" &&
    has(tags, "violences_conjugales") &&
    !alreadyHas("urgence_3919")
  ) {
    result.push({ blockKey: "urgence_3919", position: "top" });
  }

  // 3) logement_urgence → 115
  if (has(tags, "logement_urgence") && !alreadyHas("urgence_115")) {
    result.push({ blockKey: "urgence_115", position: "top" });
  }

  // 4) suicide / détresse → 3114
  if (
    (has(tags, "suicide") || has(tags, "détresse") || has(tags, "detresse")) &&
    !alreadyHas("urgence_3114")
  ) {
    result.push({ blockKey: "urgence_3114", position: "top" });
  }

  // 5) Adulte sans CTA "end" → chat_anonyme en end
  if (
    post.audience === "adult" &&
    !hasEndCTA &&
    !alreadyHas("chat_anonyme")
  ) {
    result.push({ blockKey: "chat_anonyme", position: "end" });
  }

  // Dédoublonnage final sur (blockKey + position)
  const seen = new Set<string>();
  return result.filter((c) => {
    const k = `${c.blockKey}:${c.position}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
