"use client";

import { useEffect, useState } from "react";

import {
  type AdminIdentity,
  type AdminRole,
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUser,
} from "@/lib/api";

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super-admin",
  moderator_119: "Modérateur 119",
  content_editor: "Éditeur contenu",
  b2b_sales: "Commercial B2B",
};

const ROLES: AdminRole[] = ["super_admin", "moderator_119", "content_editor", "b2b_sales"];

export default function UsersPage() {
  const [users, setUsers] = useState<AdminIdentity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", role: "content_editor" as AdminRole });

  async function load() {
    try {
      setUsers(await fetchAdminUsers());
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
    setCreating(true);
    try {
      await createAdminUser(form.email, form.password, form.role);
      setForm({ email: "", password: "", role: "content_editor" });
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(u: AdminIdentity) {
    try {
      await updateAdminUser(u.id, { active: !u.active });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function changeRole(u: AdminIdentity, role: AdminRole) {
    try {
      await updateAdminUser(u.id, { role });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function remove(u: AdminIdentity) {
    if (!confirm(`Supprimer ${u.email} ?`)) return;
    try {
      await deleteAdminUser(u.id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      <h1 className="text-elsai-pin-dark mb-2 font-serif text-3xl">Utilisateurs admin</h1>
      <p className="text-elsai-ink/70 mb-6 text-sm">
        Rôles RBAC : super-admin (tout), modérateur 119 (alertes mineurs), éditeur contenu
        (prompts/modules), commercial B2B (exports, organisations).
      </p>

      {error && (
        <div className="rounded-organic border-elsai-urgence/30 bg-elsai-urgence/10 text-elsai-urgence mb-4 border p-4">
          {error}
        </div>
      )}

      <form
        onSubmit={create}
        className="rounded-organic border-elsai-pin/15 shadow-organic mb-6 grid grid-cols-1 gap-3 border bg-white/80 p-4 backdrop-blur md:grid-cols-4"
      >
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="email@elsai.fr"
          required
          className="border-elsai-pin/20 rounded-organic border bg-white px-3 py-2 text-sm"
        />
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Mot de passe (8+ car.)"
          minLength={8}
          required
          className="border-elsai-pin/20 rounded-organic border bg-white px-3 py-2 text-sm"
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}
          className="border-elsai-pin/20 rounded-organic border bg-white px-3 py-2 text-sm"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={creating}
          className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark px-4 py-2 text-sm disabled:opacity-50"
        >
          {creating ? "Création…" : "Créer l'utilisateur"}
        </button>
      </form>

      <div className="rounded-organic border-elsai-pin/15 shadow-organic overflow-hidden border bg-white/80 backdrop-blur">
        <table className="w-full text-left text-sm">
          <thead className="bg-elsai-pin/5 text-elsai-pin-dark text-xs uppercase">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Rôle</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2">Dernière connexion</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-elsai-pin/10 border-t">
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u, e.target.value as AdminRole)}
                    className="border-elsai-pin/20 rounded-organic border bg-white px-2 py-1 text-xs"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-organic px-2 py-0.5 text-xs ${
                      u.active
                        ? "bg-elsai-pin/10 text-elsai-pin-dark"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {u.active ? "Actif" : "Désactivé"}
                  </span>
                </td>
                <td className="text-elsai-ink/70 px-3 py-2 text-xs">
                  {u.last_login ? new Date(u.last_login).toLocaleString("fr-FR") : "—"}
                </td>
                <td className="space-x-2 px-3 py-2 text-xs">
                  <button onClick={() => toggleActive(u)} className="hover:underline">
                    {u.active ? "Désactiver" : "Activer"}
                  </button>
                  <button onClick={() => remove(u)} className="text-elsai-urgence hover:underline">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="text-elsai-ink/60 px-3 py-6 text-center">
                  Aucun utilisateur.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
