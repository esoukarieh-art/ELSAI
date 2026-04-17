import Image from "next/image";
import Link from "next/link";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Le service",
    links: [
      { href: "/comment-ca-marche", label: "Comment ça marche" },
      { href: "/cas-usage", label: "Cas d'usage" },
      { href: "/pour-qui", label: "Pour qui ?" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Confiance",
    links: [
      { href: "/ethique", label: "Notre éthique" },
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/mentions-legales#rgpd", label: "Données & RGPD" },
      { href: "/mentions-legales#accessibilite", label: "Accessibilité" },
    ],
  },
  {
    title: "Professionnels",
    links: [
      { href: "/partenariats", label: "Partenariats" },
      { href: "/contact", label: "Nous écrire" },
      { href: "/blog", label: "Blog & ressources" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-elsai-pin/10 bg-elsai-creme-dark/40 mt-24 border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-elsai.svg" alt="" width={40} height={40} />
            <span className="text-elsai-pin-dark text-lg font-semibold">ELSAI</span>
          </Link>
          <p className="text-elsai-ink/75 mt-3 max-w-xs text-sm leading-relaxed">
            Assistance sociale numérique. Anonyme, disponible 24/7, hébergée en France.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-elsai-pin-dark mb-3 text-sm font-semibold tracking-wide uppercase">
              {col.title}
            </h3>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-elsai-ink/80 hover:text-elsai-pin-dark text-sm"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-elsai-pin/10 border-t">
        <div className="text-elsai-ink/60 mx-auto flex max-w-6xl flex-col justify-between gap-2 px-4 py-5 text-xs md:flex-row">
          <p>© {new Date().getFullYear()} ELSAI — Projet d'intérêt général</p>
          <p>Hébergé en France · Sans cookies · RGAA AA visé</p>
        </div>
      </div>
    </footer>
  );
}
