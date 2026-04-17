"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Plan = { key: "essentiel" | "premium"; nom: string; prix: number; couleur: string };

const PLANS: Plan[] = [
  { key: "essentiel", nom: "Essentiel", prix: 3, couleur: "pin" },
  { key: "premium", nom: "Premium", prix: 5, couleur: "rose" },
];

export default function PriceCalculator() {
  const [salaries, setSalaries] = useState(80);
  const [annuel, setAnnuel] = useState(false);

  const results = useMemo(
    () =>
      PLANS.map((p) => {
        const mensuel = salaries * p.prix;
        const annuelBrut = mensuel * 12;
        const annuelRemise = Math.round(annuelBrut * 0.9);
        return {
          ...p,
          mensuel,
          annuel: annuelRemise,
          affichage: annuel ? annuelRemise : mensuel,
          unite: annuel ? "€ / an HT (remise 10%)" : "€ / mois HT",
        };
      }),
    [salaries, annuel],
  );

  return (
    <div className="rounded-organic border-elsai-pin/20 bg-elsai-creme border p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
            Simulateur
          </p>
          <h3 className="text-elsai-pin-dark mt-2 font-serif text-2xl">
            Combien ELSAI coûterait-il à votre entreprise&nbsp;?
          </h3>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => setAnnuel(false)}
            className={`rounded-organic px-4 py-2 font-semibold transition-colors ${
              !annuel
                ? "bg-elsai-pin text-elsai-creme"
                : "border-elsai-pin/30 text-elsai-ink/70 border"
            }`}
            aria-pressed={!annuel}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setAnnuel(true)}
            className={`rounded-organic px-4 py-2 font-semibold transition-colors ${
              annuel
                ? "bg-elsai-pin text-elsai-creme"
                : "border-elsai-pin/30 text-elsai-ink/70 border"
            }`}
            aria-pressed={annuel}
          >
            Annuel −10%
          </button>
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="salaries" className="text-elsai-ink mb-2 flex items-baseline justify-between text-sm font-semibold">
          <span>Nombre de salariés</span>
          <span className="text-elsai-pin-dark font-serif text-2xl">{salaries}</span>
        </label>
        <input
          id="salaries"
          type="range"
          min={5}
          max={500}
          step={5}
          value={salaries}
          onChange={(e) => setSalaries(Number(e.target.value))}
          className="accent-elsai-pin w-full"
          aria-label="Nombre de salariés"
        />
        <div className="text-elsai-ink/50 mt-1 flex justify-between text-xs">
          <span>5</span>
          <span>500+</span>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {results.map((r) => (
          <div
            key={r.key}
            className={`rounded-organic border p-5 ${
              r.couleur === "rose" ? "border-elsai-rose/30" : "border-elsai-pin/15"
            }`}
          >
            <p
              className={`text-xs font-semibold tracking-widest uppercase ${
                r.couleur === "rose" ? "text-elsai-rose-dark" : "text-elsai-pin"
              }`}
            >
              {r.nom}
            </p>
            <p className="text-elsai-pin-dark mt-2 font-serif text-3xl">
              {r.affichage.toLocaleString("fr-FR")} €
            </p>
            <p className="text-elsai-ink/60 mt-1 text-xs">{r.unite}</p>
            <Link
              href={`/offre/souscrire?plan=${r.key}`}
              className={`rounded-organic mt-4 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold transition-colors ${
                r.couleur === "rose"
                  ? "bg-elsai-rose-dark text-elsai-creme hover:bg-elsai-rose-dark/90"
                  : "bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark"
              }`}
            >
              Souscrire ce plan →
            </Link>
          </div>
        ))}
      </div>

      <p className="text-elsai-ink/60 mt-5 text-xs">
        Pour plus de 500 salariés, l'offre Sur mesure propose une tarification négociée. TVA 20% en sus.
      </p>
    </div>
  );
}
