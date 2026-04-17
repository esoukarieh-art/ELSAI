"use client";

import { useEffect, useState } from "react";

const ITEMS = [
  { id: "constat", label: "Le constat" },
  { id: "salaries", label: "Pour vos salariés" },
  { id: "entreprise", label: "Pour votre entreprise" },
  { id: "tarifs", label: "Tarifs" },
  { id: "simulateur", label: "Simulateur" },
  { id: "comparatif", label: "Comparatif" },
  { id: "deploiement", label: "Déploiement" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
];

export default function OffreToc() {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    ITEMS.forEach((i) => {
      const el = document.getElementById(i.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label="Sommaire" className="sticky top-24 hidden xl:block">
      <p className="text-elsai-pin mb-3 text-xs font-semibold tracking-[0.2em] uppercase">
        Sommaire
      </p>
      <ul className="space-y-1 text-sm">
        {ITEMS.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              className={`block rounded px-3 py-1.5 transition-colors ${
                active === i.id
                  ? "bg-elsai-pin/10 text-elsai-pin-dark font-semibold"
                  : "text-elsai-ink/70 hover:text-elsai-pin-dark"
              }`}
            >
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
