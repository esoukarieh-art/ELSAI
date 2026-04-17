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
    <header className="sticky top-0 z-40 border-b border-elsai-pin/10 bg-elsai-creme/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="ELSAI — accueil">
          <Image src="/logo-elsai.svg" alt="" width={36} height={36} priority />
          <span className="text-lg font-semibold tracking-tight text-elsai-pin-dark">ELSAI</span>
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
            className="hidden px-3 py-2 text-sm text-elsai-ink/80 hover:text-elsai-pin-dark md:inline"
          >
            Contact
          </Link>
          <Link
            href="/start"
            className="inline-flex items-center gap-2 rounded-organic bg-elsai-pin px-4 py-2.5 text-sm font-semibold text-elsai-creme shadow-organic transition-colors hover:bg-elsai-pin-dark"
          >
            Poser ma question
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="rounded-lg p-2 hover:bg-elsai-pin/10 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <span className="mb-1 block h-0.5 w-5 bg-elsai-ink" />
            <span className="mb-1 block h-0.5 w-5 bg-elsai-ink" />
            <span className="block h-0.5 w-5 bg-elsai-ink" />
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Menu mobile"
          className="border-t border-elsai-pin/10 bg-elsai-creme lg:hidden"
        >
          <ul className="space-y-1 px-4 py-3">
            {NAV.concat({ href: "/contact", label: "Contact" }).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-elsai-ink hover:bg-elsai-pin/10"
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
