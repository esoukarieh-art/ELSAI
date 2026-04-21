"use client";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-emerald-500",
  A2: "bg-emerald-400",
  B1: "bg-lime-500",
  B2: "bg-amber-500",
  C1: "bg-orange-500",
  C2: "bg-rose-600",
};

interface Props {
  level: string | null | undefined;
  score?: number | null;
  compact?: boolean;
}

export default function ReadabilityGauge({ level, score, compact }: Props) {
  const current = level && LEVELS.includes(level) ? level : null;
  return (
    <div className="space-y-1">
      {!compact && (
        <div className="text-elsai-ink/70 flex items-center justify-between text-xs">
          <span>Lisibilité</span>
          <span className="font-semibold">
            {current ?? "—"}
            {typeof score === "number" ? ` · ${score}` : ""}
          </span>
        </div>
      )}
      <div className="flex gap-1">
        {LEVELS.map((lvl) => {
          const active = lvl === current;
          return (
            <div
              key={lvl}
              className={`h-2 flex-1 rounded-organic transition-all ${
                active ? LEVEL_COLORS[lvl] : "bg-slate-200"
              }`}
              title={lvl}
            />
          );
        })}
      </div>
      {!compact && (
        <p className="text-elsai-ink/50 text-[10px]">
          Cible ≤ B1 pour grand public. C1/C2 = trop complexe.
        </p>
      )}
    </div>
  );
}
