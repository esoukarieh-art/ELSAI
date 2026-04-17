"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/exemples-concrets", label: "Exemples concrets" },
  { href: "/ethique", label: "Notre éthique" },
  { href: "/partenariats", label: "Partenariats" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="bg-elsai-creme/90 border-elsai-pin/10 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="ELSAI — accueil">
          <Image src="/logo-elsai.svg" alt="" width={36} height={36} loading="eager" />
          <span className="text-elsai-pin-dark text-lg font-semibold tracking-tight">ELSAI</span>
        </Link>

        <nav aria-label="Principale" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-elsai-pin/10 text-elsai-pin-dark"
                    : "text-elsai-ink/80 hover:bg-elsai-pin/5 hover:text-elsai-pin-dark"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/contact"
            className="text-elsai-ink/80 hover:text-elsai-pin-dark hidden px-3 py-2 text-sm md:inline"
          >
            Contact
          </Link>
          <Link
            href="/start"
            className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic hover:bg-elsai-pin-dark inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            Poser ma question
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            className="hover:bg-elsai-pin/10 rounded-lg p-2 lg:hidden"
          >
            <span aria-hidden="true" className="bg-elsai-ink mb-1 block h-0.5 w-5" />
            <span aria-hidden="true" className="bg-elsai-ink mb-1 block h-0.5 w-5" />
            <span aria-hidden="true" className="bg-elsai-ink block h-0.5 w-5" />
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Menu mobile"
          className="border-elsai-pin/10 bg-elsai-creme border-t lg:hidden"
        >
          <ul className="space-y-1 px-4 py-3">
            {NAV.concat({ href: "/contact", label: "Contact" }).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-elsai-ink hover:bg-elsai-pin/10 block rounded-lg px-3 py-2.5"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
