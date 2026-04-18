"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  type AdminRole,
  adminLogin,
  clearAdminToken,
  getAdminRole,
  getAdminToken,
  setAdminToken,
} from "@/lib/api";

interface NavItem {
  href: string;
  label: string;
  roles?: AdminRole[]; // si présent, seuls ces rôles + super_admin voient
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Métriques" },
  { href: "/admin/alerts", label: "Alertes mineurs", roles: ["moderator_119"] },
  { href: "/admin/prompts", label: "Prompts IA", roles: ["content_editor"] },
  { href: "/admin/experiments", label: "A/B testing", roles: ["content_editor"] },
  { href: "/admin/features", label: "Modules & parcours", roles: ["content_editor"] },
  { href: "/admin/audit", label: "Journal d'audit" },
  { href: "/admin/forget", label: "Droit à l'oubli" },
  { href: "/admin/exports", label: "Exports", roles: ["b2b_sales", "content_editor"] },
  { href: "/admin/users", label: "Utilisateurs", roles: [] }, // super_admin uniquement
];

function canSee(role: AdminRole | null, item: NavItem): boolean {
  if (role === "super_admin") return true;
  if (!item.roles) return true;
  if (item.roles.length === 0) return false;
  return role !== null && item.roles.includes(role);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [mode, setMode] = useState<"password" | "token">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAuthed(!!getAdminToken());
    setRole(getAdminRole());
    const onUnauth = () => {
      setAuthed(false);
      setRole(null);
      setError("Session expirée. Merci de vous reconnecter.");
    };
    window.addEventListener("elsai:admin-unauthorized", onUnauth);
    return () => window.removeEventListener("elsai:admin-unauthorized", onUnauth);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "password") {
        const data = await adminLogin(email.trim(), password);
        setRole(data.role);
      } else {
        if (!tokenInput.trim()) return;
        setAdminToken(tokenInput.trim(), "legacy", "super_admin");
        setRole("super_admin");
      }
      setAuthed(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearAdminToken();
    setAuthed(false);
    setRole(null);
  }

  return (
    <main className="min-h-screen">
      <div className="from-elsai-pin via-elsai-rose to-elsai-pin h-1 w-full bg-gradient-to-r" />
      <header className="border-elsai-pin/10 flex items-center justify-between border-b bg-white/80 px-4 py-3 backdrop-blur">
        <Link href="/" className="text-elsai-pin-dark flex items-center gap-2 font-bold">
          <Image src="/logo-elsai.svg" alt="" width={32} height={32} />
          <span>← ELSAI · Backoffice</span>
        </Link>
        {authed && (
          <div className="flex items-center gap-4 text-sm">
            <span className="bg-elsai-pin/10 text-elsai-pin-dark rounded-organic px-2 py-0.5 text-xs font-medium">
              {role ?? "inconnu"}
            </span>
            <button
              onClick={handleLogout}
              className="text-elsai-ink/70 hover:text-elsai-pin transition-colors"
            >
              Déconnexion
            </button>
          </div>
        )}
      </header>

      {!authed ? (
        <form
          onSubmit={handleLogin}
          className="rounded-organic border-elsai-pin/15 shadow-organic mx-auto mt-10 max-w-md space-y-4 border bg-white/70 p-6 backdrop-blur"
        >
          <h1 className="text-elsai-pin-dark font-serif text-2xl">Accès backoffice</h1>

          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setMode("password")}
              className={`rounded-organic border px-3 py-1 ${
                mode === "password"
                  ? "bg-elsai-pin text-elsai-creme border-elsai-pin"
                  : "border-elsai-pin/20 bg-white"
              }`}
            >
              Email + mot de passe
            </button>
            <button
              type="button"
              onClick={() => setMode("token")}
              className={`rounded-organic border px-3 py-1 ${
                mode === "token"
                  ? "bg-elsai-pin text-elsai-creme border-elsai-pin"
                  : "border-elsai-pin/20 bg-white"
              }`}
            >
              Token super-admin (legacy)
            </button>
          </div>

          {mode === "password" ? (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@elsai.fr"
                autoComplete="username"
                className="border-elsai-pin/20 focus:border-elsai-pin rounded-organic w-full border bg-white/80 px-4 py-2 focus:outline-none"
                required
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                autoComplete="current-password"
                className="border-elsai-pin/20 focus:border-elsai-pin rounded-organic w-full border bg-white/80 px-4 py-2 focus:outline-none"
                required
              />
            </>
          ) : (
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Token admin"
              className="border-elsai-pin/20 focus:border-elsai-pin rounded-organic w-full border bg-white/80 px-4 py-2 focus:outline-none"
            />
          )}

          {error && <p className="text-elsai-urgence text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark w-full px-6 py-2 transition-colors disabled:opacity-50"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      ) : (
        <div className="mx-auto max-w-6xl px-4 py-6">
          <nav className="mb-6 flex flex-wrap gap-2">
            {NAV.filter((item) => canSee(role, item)).map((item) => {
              const active =
                item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-organic border px-4 py-2 text-sm transition-colors ${
                    active
                      ? "bg-elsai-pin text-elsai-creme border-elsai-pin"
                      : "border-elsai-pin/20 text-elsai-pin-dark hover:bg-elsai-pin/5 bg-white/70"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {children}
        </div>
      )}
    </main>
  );
}
