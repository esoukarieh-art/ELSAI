interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "pin" | "rose" | "neutral";
}

const TONE_CLASSES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  pin: "border-elsai-pin/30 bg-elsai-pin/5",
  rose: "border-elsai-rose/30 bg-elsai-rose/5",
  neutral: "border-slate-200 bg-white/70",
};

export default function StatCard({ label, value, hint, tone = "neutral" }: StatCardProps) {
  return (
    <div className={`rounded-organic border p-4 ${TONE_CLASSES[tone]}`}>
      <p className="text-elsai-ink/60 text-[11px] uppercase tracking-wide">{label}</p>
      <p className="text-elsai-pin-dark font-serif text-2xl">{value}</p>
      {hint && <p className="text-elsai-ink/50 mt-1 text-xs">{hint}</p>}
    </div>
  );
}
