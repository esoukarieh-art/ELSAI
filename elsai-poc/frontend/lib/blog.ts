import type { ReactNode } from "react";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  dateHuman: string;
  readingMinutes: number;
  tags: string[];
  author: string;
  heroEyebrow: string;
};

export const POSTS: BlogPost[] = [
  {
    slug: "10-milliards-aides-sociales-non-reclamees",
    title: "10 milliards d'euros d'aides sociales non réclamées chaque année : comprendre le non-recours",
    description:
      "Chaque année en France, près de 10 milliards d'euros d'aides sociales ne sont pas réclamés. Derrière ce chiffre de la DREES, un problème massif d'accès aux droits — et des leviers concrets pour l'entreprise comme pour les personnes concernées.",
    date: "2026-04-17",
    dateHuman: "17 avril 2026",
    readingMinutes: 8,
    tags: ["Non-recours", "DREES", "Droits sociaux"],
    author: "L'équipe ELSAI",
    heroEyebrow: "Droits sociaux",
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
}

export type PostContent = () => ReactNode;
