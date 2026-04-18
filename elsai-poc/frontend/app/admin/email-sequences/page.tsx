"use client";

import { useEffect, useMemo, useState } from "react";

import {
  type EmailHistoryRow,
  type EmailSequenceSummary,
  type EmailTemplateDetail,
  type EmailTemplateSummary,
  type EmailTemplateUpdate,
  getEmailTemplate,
  listEmailHistory,
  listEmailSequences,
  listEmailTemplatesInSequence,
  setEmailSequenceActive,
  testSendEmailTemplate,
  updateEmailTemplate,
} from "@/lib/api";

function formatDelay(hours: number): string {
  if (hours === 0) return "J+0 (immédiat)";
  const days = Math.round(hours / 24);
  if (hours < 0) return `J${days} (${hours}h avant)`;
  if (Math.abs(hours) >= 24 && hours % 24 === 0) return `J+${days}`;
  return `+${hours}h`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  sent: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-100 text-slate-600",
  failed: "bg-rose-100 text-rose-800",
};

export default function EmailSequencesPage() {
  const [sequences, setSequences] = useState<EmailSequenceSummary[]>([]);
  const [selectedSeq, setSelectedSeq] = useState<string | null>(null);
  const [steps, setSteps] = useState<EmailTemplateSummary[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [detail, setDetail] = useState<EmailTemplateDetail | null>(null);
  const [draft, setDraft] = useState<EmailTemplateUpdate>({});
  const [history, setHistory] = useState<EmailHistoryRow[]>([]);
  const [testEmail, setTestEmail] = useState("");
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currentSeq = useMemo(
    () => sequences.find((s) => s.sequence_key === selectedSeq) ?? null,
    [sequences, selectedSeq],
  );

  async function loadSequences() {
    try {
      const data = await listEmailSequences();
      setSequences(data);
      if (!selectedSeq && data.length) {
        setSelectedSeq(data[0].sequence_key);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function loadSteps(seqKey: string) {
    try {
      const data = await listEmailTemplatesInSequence(seqKey);
      setSteps(data);
      if (data.length && !data.find((s) => s.key === selectedKey)) {
        setSelectedKey(data[0].key);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function loadDetail(key: string) {
    try {
      const d = await getEmailTemplate(key);
      setDetail(d);
      setDraft({
        subject: d.subject,
        preview: d.preview ?? "",
        html_content: d.html_content,
        text_content: d.text_content ?? "",
        delay_hours: d.delay_hours,
        step_label: d.step_label,
        active: d.active,
        notes: d.notes ?? "",
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function loadHistory(seqKey: string) {
    try {
      const data = await listEmailHistory(seqKey, undefined, 50);
      setHistory(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    loadSequences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedSeq) {
      loadSteps(selectedSeq);
      loadHistory(selectedSeq);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeq]);

  useEffect(() => {
    if (selectedKey) loadDetail(selectedKey);
  }, [selectedKey]);

  async function handleSave() {
    if (!selectedKey) return;
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const updated = await updateEmailTemplate(selectedKey, draft);
      setDetail(updated);
      setInfo("Template enregistré.");
      await Promise.all([loadSequences(), selectedSeq ? loadSteps(selectedSeq) : Promise.resolve()]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTestSend() {
    if (!selectedKey || !testEmail.trim()) return;
    setTestStatus("Envoi en cours…");
    try {
      const r = await testSendEmailTemplate(selectedKey, testEmail.trim());
      setTestStatus(
        r.sent
          ? `Envoyé (message id : ${r.message_id ?? "n/a"})`
          : "Échec de l'envoi (réponse vide).",
      );
    } catch (e) {
      setTestStatus(`Erreur : ${(e as Error).message}`);
    }
  }

  async function handleTogglePause() {
    if (!currentSeq) return;
    try {
      const next = !currentSeq.steps_active;
      // next = true → activer ; steps_active=0 signifie séquence pausée
      await setEmailSequenceActive(currentSeq.sequence_key, next);
      await loadSequences();
      if (selectedSeq) await loadSteps(selectedSeq);
      if (selectedKey) await loadDetail(selectedKey);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div>
      <h1 className="text-elsai-pin-dark mb-2 font-serif text-3xl">Séquences email</h1>
      <p className="text-elsai-ink/70 mb-4 text-sm leading-relaxed">
        Éditez les 8 séquences email ELSAI (onboarding B2B, dunning, rapports, démarches B2C…).
        Toute modification prend effet immédiatement pour les prochains envois. Les envois déjà
        planifiés conservent le contenu rendu au moment de leur planification.
      </p>

      {error && (
        <p className="text-elsai-urgence mb-3 rounded-organic border border-rose-200 bg-rose-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      {info && (
        <p className="mb-3 rounded-organic border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {info}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[260px_220px_1fr]">
        {/* Col 1 : séquences */}
        <aside className="rounded-organic border-elsai-pin/15 bg-white/70 border p-3">
          <h2 className="text-elsai-pin-dark mb-2 text-sm font-semibold uppercase">
            Séquences
          </h2>
          <ul className="space-y-1">
            {sequences.map((s) => {
              const active = s.sequence_key === selectedSeq;
              const paused = s.steps_active === 0;
              return (
                <li key={s.sequence_key}>
                  <button
                    onClick={() => {
                      setSelectedSeq(s.sequence_key);
                      setSelectedKey(null);
                      setDetail(null);
                    }}
                    className={`w-full rounded-organic px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? "bg-elsai-pin text-elsai-creme"
                        : "hover:bg-elsai-pin/5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{s.sequence_label}</span>
                      <span
                        className={`rounded-organic px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                          s.audience === "b2b"
                            ? "bg-sky-100 text-sky-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {s.audience}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] opacity-80">
                      <span>
                        {s.steps_active}/{s.steps_total} étape
                        {s.steps_total > 1 ? "s" : ""}
                      </span>
                      {paused && <span className="text-amber-700">· en pause</span>}
                      {s.pending_count > 0 && (
                        <span>· {s.pending_count} en attente</span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Col 2 : étapes de la séquence */}
        <aside className="rounded-organic border-elsai-pin/15 bg-white/70 border p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-elsai-pin-dark text-sm font-semibold uppercase">Étapes</h2>
            {currentSeq && (
              <button
                onClick={handleTogglePause}
                className="text-elsai-pin-dark text-xs underline"
              >
                {currentSeq.steps_active === 0 ? "Activer" : "Pauser"}
              </button>
            )}
          </div>
          {steps.length === 0 ? (
            <p className="text-elsai-ink/50 text-sm">Sélectionnez une séquence.</p>
          ) : (
            <ul className="space-y-1">
              {steps.map((step) => {
                const active = step.key === selectedKey;
                return (
                  <li key={step.key}>
                    <button
                      onClick={() => setSelectedKey(step.key)}
                      className={`w-full rounded-organic px-3 py-2 text-left text-sm transition-colors ${
                        active
                          ? "bg-elsai-pin text-elsai-creme"
                          : "hover:bg-elsai-pin/5"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{step.step_label || step.key}</span>
                        {!step.active && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800">
                            off
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] opacity-80">
                        {formatDelay(step.delay_hours)}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Col 3 : éditeur */}
        <section className="rounded-organic border-elsai-pin/15 bg-white/70 border p-4">
          {!detail ? (
            <p className="text-elsai-ink/50 text-sm">Sélectionnez une étape à éditer.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-elsai-pin-dark font-serif text-xl">
                    {detail.step_label || detail.key}
                  </h2>
                  <p className="text-elsai-ink/60 text-xs">
                    clé : <code>{detail.key}</code> · audience {detail.audience} · modifié le{" "}
                    {formatDate(detail.updated_at)}
                    {detail.updated_by ? ` par ${detail.updated_by}` : ""}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.active ?? false}
                    onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                  />
                  Actif
                </label>
              </div>

              {detail.notes && (
                <div className="rounded-organic border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Note : {detail.notes}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-elsai-ink/80 mb-1 block text-xs uppercase">Sujet</span>
                  <input
                    value={draft.subject ?? ""}
                    onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                    className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin w-full border bg-white px-3 py-2 text-sm focus:outline-none"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-elsai-ink/80 mb-1 block text-xs uppercase">
                    Délai (heures)
                  </span>
                  <input
                    type="number"
                    value={draft.delay_hours ?? 0}
                    onChange={(e) =>
                      setDraft({ ...draft, delay_hours: Number(e.target.value) })
                    }
                    className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin w-full border bg-white px-3 py-2 text-sm focus:outline-none"
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="text-elsai-ink/80 mb-1 block text-xs uppercase">Preview</span>
                <input
                  value={draft.preview ?? ""}
                  onChange={(e) => setDraft({ ...draft, preview: e.target.value })}
                  className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin w-full border bg-white px-3 py-2 text-sm focus:outline-none"
                />
              </label>

              <label className="block text-sm">
                <span className="text-elsai-ink/80 mb-1 block text-xs uppercase">
                  HTML (variables : {"{{company_name}}"}, {"{{seats}}"}, etc.)
                </span>
                <textarea
                  value={draft.html_content ?? ""}
                  onChange={(e) => setDraft({ ...draft, html_content: e.target.value })}
                  rows={10}
                  className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin w-full border bg-white px-3 py-2 font-mono text-xs focus:outline-none"
                />
              </label>

              <label className="block text-sm">
                <span className="text-elsai-ink/80 mb-1 block text-xs uppercase">
                  Texte brut (fallback)
                </span>
                <textarea
                  value={draft.text_content ?? ""}
                  onChange={(e) => setDraft({ ...draft, text_content: e.target.value })}
                  rows={5}
                  className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin w-full border bg-white px-3 py-2 font-mono text-xs focus:outline-none"
                />
              </label>

              <details className="rounded-organic border-elsai-pin/15 border bg-white/50 px-3 py-2">
                <summary className="text-elsai-pin-dark cursor-pointer text-sm font-semibold">
                  Aperçu HTML rendu (contexte synthétique)
                </summary>
                <iframe
                  title="preview"
                  className="mt-2 h-96 w-full rounded border"
                  srcDoc={draft.html_content ?? ""}
                />
              </details>

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark px-4 py-2 text-sm transition-colors disabled:opacity-50"
                >
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>

                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="email"
                    placeholder="test@exemple.fr"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin flex-1 border bg-white px-3 py-2 text-sm focus:outline-none"
                  />
                  <button
                    onClick={handleTestSend}
                    className="rounded-organic border-elsai-pin text-elsai-pin-dark hover:bg-elsai-pin/10 border px-4 py-2 text-sm transition-colors"
                  >
                    Envoyer un test
                  </button>
                </div>
              </div>
              {testStatus && (
                <p className="text-elsai-ink/70 text-xs">{testStatus}</p>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Historique */}
      <section className="rounded-organic border-elsai-pin/15 bg-white/70 mt-6 border p-4">
        <h2 className="text-elsai-pin-dark mb-3 font-serif text-lg">
          Historique — {currentSeq?.sequence_label ?? "toutes séquences"}
        </h2>
        {history.length === 0 ? (
          <p className="text-elsai-ink/50 text-sm">Aucun envoi pour cette séquence.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-elsai-ink/60 text-xs uppercase">
                <tr>
                  <th className="px-2 py-1 text-left">Quand</th>
                  <th className="px-2 py-1 text-left">Étape</th>
                  <th className="px-2 py-1 text-left">Destinataire</th>
                  <th className="px-2 py-1 text-left">Statut</th>
                  <th className="px-2 py-1 text-left">Erreur</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-t border-slate-100">
                    <td className="px-2 py-1">
                      {formatDate(h.sent_at ?? h.send_at)}
                    </td>
                    <td className="px-2 py-1">{h.step_order}</td>
                    <td className="px-2 py-1">{h.recipient_email}</td>
                    <td className="px-2 py-1">
                      <span
                        className={`rounded-organic px-2 py-0.5 text-[11px] ${
                          STATUS_STYLE[h.status] ?? "bg-slate-100"
                        }`}
                      >
                        {h.status}
                      </span>
                    </td>
                    <td className="text-elsai-urgence px-2 py-1 text-xs">
                      {h.error ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
