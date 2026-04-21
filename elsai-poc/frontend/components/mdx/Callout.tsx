import type { ReactNode } from "react";

type Tone = "info" | "warning" | "tip";

interface Props {
  tone?: Tone;
  title?: string;
  children: ReactNode;
}

const TONE_STYLES: Record<Tone, string> = {
  info: "border-elsai-pin/30 bg-elsai-pin/5 text-elsai-ink",
  warning: "border-amber-400/40 bg-amber-50 text-amber-900",
  tip: "border-elsai-rose/40 bg-elsai-rose/10 text-elsai-ink",
};

export function Callout({ tone = "info", title, children }: Props) {
  return (
    <aside className={`rounded-organic my-6 border-l-4 p-5 ${TONE_STYLES[tone]}`}>
      {title && <div className="mb-2 font-semibold">{title}</div>}
      <div className="leading-relaxed">{children}</div>
    </aside>
  );
}
