interface FunnelStep {
  key: string;
  label: string;
  count: number;
}

interface FunnelBarsProps {
  steps: FunnelStep[];
}

const COLORS = ["#5A7E6B", "#9B7F7F", "#7E6B5A"];

export default function FunnelBars({ steps }: FunnelBarsProps) {
  const max = Math.max(...steps.map((s) => s.count), 1);

  return (
    <div className="space-y-3">
      {steps.map((s, i) => {
        const pct = Math.round((s.count / max) * 100);
        const prev = i > 0 ? steps[i - 1].count : s.count;
        const conv = prev > 0 ? Math.round((s.count / prev) * 100) : 100;
        return (
          <div key={s.key}>
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="text-elsai-ink/80 font-medium">{s.label}</span>
              <span className="text-elsai-ink/60">
                {s.count.toLocaleString("fr-FR")}
                {i > 0 && (
                  <span className="text-elsai-ink/40 ml-2">({conv}% de l'étape précédente)</span>
                )}
              </span>
            </div>
            <div className="bg-elsai-creme/60 rounded-organic h-6 overflow-hidden border border-slate-200">
              <div
                className="h-full rounded-organic transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundColor: COLORS[i % COLORS.length],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
