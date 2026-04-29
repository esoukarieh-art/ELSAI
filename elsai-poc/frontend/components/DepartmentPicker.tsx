"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/api";

interface Department {
  code: string;
  name: string;
  slug: string;
  prefecture: string;
  region: string;
}

interface Props {
  conversationId: string | undefined;
  onChange?: (code: string | null) => void;
}

export default function DepartmentPicker({ conversationId, onChange }: Props) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [code, setCode] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/api/public/aides/taxonomy`)
      .then((r) => r.json())
      .then((data) => setDepartments(data.departments || []))
      .catch(() => {});
    const stored = sessionStorage.getItem("elsai_department_code");
    if (stored) setCode(stored);
  }, []);

  async function save(value: string | null) {
    if (!conversationId) return;
    setSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = getToken();
      await fetch(`${apiUrl}/api/chat/department`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          department_code: value,
        }),
      });
      if (value) sessionStorage.setItem("elsai_department_code", value);
      else sessionStorage.removeItem("elsai_department_code");
      setCode(value || "");
      onChange?.(value);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  const current = departments.find((d) => d.code === code);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-elsai-pin-dark hover:text-elsai-pin text-xs underline-offset-2 hover:underline"
      >
        {current ? `📍 ${current.name}` : "📍 Mon département (optionnel)"}
      </button>
      {open && (
        <div className="rounded-organic border-elsai-pin/20 shadow-organic absolute right-0 top-full z-30 mt-2 w-72 border bg-white p-3">
          <p className="text-elsai-ink/70 mb-2 text-xs">
            Pour des contacts locaux (CAF, MDPH...). Stocké uniquement le temps
            de la conversation.
          </p>
          <select
            value={code}
            onChange={(e) => save(e.target.value || null)}
            disabled={saving || !conversationId}
            className="rounded-organic border-elsai-pin/20 w-full border px-2 py-2 text-sm"
          >
            <option value="">— Choisir —</option>
            {departments.map((d) => (
              <option key={d.code} value={d.code}>
                {d.code} — {d.name}
              </option>
            ))}
          </select>
          {code && (
            <button
              onClick={() => save(null)}
              disabled={saving}
              className="text-elsai-rose-dark mt-2 text-xs underline"
            >
              Effacer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
