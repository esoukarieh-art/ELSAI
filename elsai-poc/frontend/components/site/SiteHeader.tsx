"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/cas-usage", label: "Cas d'usage" },
  { href: "/pour-qui", label: "Pour qui ?" },
  { href: "/ethique", label: "Éthique" },
  { href: "/faq", label: "FAQ" },
  { href: "/partenariats", label: "Partenariats" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-elsai-creme/90 backdrop-blur border-b border-elsai-pin/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0"
          aria-label="ELSAI — accueil"
        >
          <Image
            src="/logo-elsai.svg"
            alt=""
            width={36}
            height={36}
            priority
          />
          <span className="font-semibold text-elsai-pin-dark tracking-tight text-lg">
            ELSAI
          </span>
        </Link>

        <nav aria-label="Principale" className="hidden lg:flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "text-elsai-pin-dark bg-elsai-pin/10"
                    : "text-elsai-ink/80 hover:text-elsai-pin-dark hover:bg-elsai-pin/5"
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
            className="hidden md:inline text-sm text-elsai-ink/80 hover:text-elsai-pin-dark px-3 py-2"
          >
            Contact
          </Link>
          <Link
            href="/start"
            className="inline-flex items-center gap-2 bg-elsai-pin text-elsai-creme px-4 py-2.5 rounded-organic text-sm font-semibold shadow-organic hover:bg-elsai-pin-dark transition-colors"
          >
            Poser ma question
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            className="lg:hidden p-2 rounded-lg hover:bg-elsai-pin/10"
          >
            <span aria-hidden="true" className="block w-5 h-0.5 bg-elsai-ink mb-1" />
            <span aria-hidden="true" className="block w-5 h-0.5 bg-elsai-ink mb-1" />
            <span aria-hidden="true" className="block w-5 h-0.5 bg-elsai-ink" />
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Menu mobile"
          className="lg:hidden border-t border-elsai-pin/10 bg-elsai-creme"
        >
          <ul className="px-4 py-3 space-y-1">
            {NAV.concat({ href: "/contact", label: "Contact" }).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-elsai-ink hover:bg-elsai-pin/10"
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
