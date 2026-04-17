import Image from "next/image";
import Link from "next/link";

const EMERGENCY = [
  { label: "Enfance en danger", tel: "119" },
  { label: "Violences faites aux femmes", tel: "3919" },
  { label: "Sans-abri", tel: "115" },
  { label: "Prévention du suicide", tel: "3114" },
  { label: "Violences numériques", tel: "3018" },
  { label: "Urgences vitales", tel: "112" },
];

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Le service",
    links: [
      { href: "/comment-ca-marche", label: "Comment ça marche" },
      { href: "/exemples-concrets", label: "Exemples concrets" },
      { href: "/offre", label: "Offre entreprises" },
    ],
  },
  {
    title: "Confiance",
    links: [
      { href: "/ethique", label: "Notre éthique" },
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/confidentialite", label: "Confidentialité & RGPD" },
      { href: "/cgu", label: "CGU (particuliers)" },
      { href: "/cgv", label: "CGV (entreprises)" },
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
            Service social numérique de premier accueil. Anonyme, disponible 24h/24, hébergé en France.
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
        <div>
          <h3 className="text-elsai-pin-dark mb-3 text-sm font-semibold tracking-wide uppercase">
            Numéros d'accès direct
          </h3>
          <p className="text-elsai-ink/60 mb-3 text-xs">Gratuits, 24h/24, selon votre situation</p>
          <ul className="space-y-2 text-sm">
            {EMERGENCY.map((n) => (
              <li key={n.tel}>
                <a
                  href={`tel:${n.tel}`}
                  className="text-elsai-ink/80 hover:text-elsai-pin-dark flex items-baseline gap-2"
                  aria-label={`Appeler le ${n.tel} — ${n.label}`}
                >
                  <span className="text-elsai-pin-dark font-bold">{n.tel}</span>
                  <span>{n.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
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
