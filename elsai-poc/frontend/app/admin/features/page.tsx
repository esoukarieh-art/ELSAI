"use client";

import { useEffect, useState } from "react";

import {
  deleteFeature,
  type FeatureFlag,
  fetchFeatures,
  toggleFeature,
  upsertFeature,
} from "@/lib/api";

const CATEGORIES = ["module", "parcours", "theme"] as const;
const CAT_LABELS: Record<string, string> = {
  module: "Modules thématiques",
  parcours: "Parcours utilisateur",
  theme: "Thèmes visuels",
};

const SUGGESTIONS: Omit<FeatureFlag, "updated_at">[] = [
  { name: "module_caf", enabled: true, description: "Aides CAF, RSA, prime d'activité", category: "module" },
  { name: "module_logement", enabled: true, description: "APL, demande HLM, DALO", category: "module" },
  { name: "module_emploi", enabled: true, description: "France Travail, CV, formation", category: "module" },
  { name: "module_sante", enabled: true, description: "CSS, AME, accès aux soins", category: "module" },
  { name: "module_annuaire", enabled: true, description: "Annuaire géolocalisé CCAS/France Services/MDA", category: "module" },
  { name: "module_courriers", enabled: true, description: "Générateur de courriers types", category: "module" },
  { name: "parcours_mineur", enabled: true, description: "Onboarding tutoiement + escalade 119", category: "parcours" },
  { name: "parcours_majeur", enabled: true, description: "Onboarding vouvoiement + démarches admin", category: "parcours" },
  { name: "theme_symbiose", enabled: true, description: "Charte Vert Pin / Vieux Rose (par défaut)", category: "theme" },
];

export default function FeaturesPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "module" as "module" | "parcours" | "theme",
    enabled: true,
  });

  async function load() {
    try {
      setFlags(await fetchFeatures());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      await upsertFeature(form);
      setForm({ name: "", description: "", category: "module", enabled: true });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function seed() {
    try {
      for (const s of SUGGESTIONS) {
        if (!flags.some((f) => f.name === s.name)) await upsertFeature(s);
      }
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function flip(f: FeatureFlag) {
    try {
      await toggleFeature(f.name, !f.enabled);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function remove(f: FeatureFlag) {
    if (!confirm(`Supprimer « ${f.name} » ?`)) return;
    try {
      await deleteFeature(f.name);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const grouped = CATEGORIES.map((c) => ({
    cat: c,
    items: flags.filter((f) => f.category === c),
  }));

  return (
    <>
      <h1 className="text-elsai-pin-dark mb-2 font-serif text-3xl">Modules & parcours</h1>
      <p className="text-elsai-ink/70 mb-6 text-sm">
        Active ou désactive à chaud les modules thématiques (CAF, logement, emploi…), les parcours
        (mineur/majeur) et les thèmes visuels, sans redéploiement.
      </p>

      {error && (
        <div className="rounded-organic border-elsai-urgence/30 bg-elsai-urgence/10 text-elsai-urgence mb-4 border p-4">
          {error}
        </div>
      )}

      {flags.length === 0 && (
        <div className="rounded-organic border-elsai-pin/15 mb-4 border bg-white/80 p-4 text-sm">
          Aucun flag défini.{" "}
          <button onClick={seed} className="text-elsai-pin-dark font-semibold hover:underline">
            Créer les modules par défaut →
          </button>
        </div>
      )}

      <form
        onSubmit={create}
        className="rounded-organic border-elsai-pin/15 shadow-organic mb-6 grid grid-cols-1 gap-3 border bg-white/80 p-4 backdrop-blur md:grid-cols-4"
      >
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="module_xxx"
          pattern="[a-z0-9_]+"
          required
          className="border-elsai-pin/20 rounded-organic border bg-white px-3 py-2 text-sm"
        />
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description"
          className="border-elsai-pin/20 rounded-organic border bg-white px-3 py-2 text-sm"
        />
        <select
          value={form.category}
          onChange={(e) =>
            setForm({ ...form, category: e.target.value as "module" | "parcours" | "theme" })
          }
          className="border-elsai-pin/20 rounded-organic border bg-white px-3 py-2 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CAT_LABELS[c]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark px-4 py-2 text-sm"
        >
          Créer / mettre à jour
        </button>
      </form>

      <div className="space-y-6">
        {grouped.map((g) => (
          <section key={g.cat}>
            <h2 className="text-elsai-pin-dark mb-2 font-serif text-xl">{CAT_LABELS[g.cat]}</h2>
            {g.items.length === 0 ? (
              <p className="text-elsai-ink/60 text-sm">Aucun flag dans cette catégorie.</p>
            ) : (
              <ul className="grid gap-2 md:grid-cols-2">
                {g.items.map((f) => (
                  <li
                    key={f.name}
                    className={`rounded-organic border p-3 backdrop-blur ${
                      f.enabled
                        ? "border-elsai-pin/20 bg-white/80"
                        : "border-gray-200 bg-gray-50 opacity-60"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <code className="text-elsai-pin-dark text-sm font-semibold">{f.name}</code>
                      <label className="flex cursor-pointer items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={f.enabled}
                          onChange={() => flip(f)}
                          className="h-4 w-4"
                        />
                        {f.enabled ? "Actif" : "Désactivé"}
                      </label>
                    </div>
                    {f.description && (
                      <p className="text-elsai-ink/70 text-xs">{f.description}</p>
                    )}
                    <button
                      onClick={() => remove(f)}
                      className="text-elsai-urgence mt-1 text-xs hover:underline"
                    >
                      Supprimer
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
