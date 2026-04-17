import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "default" | "soft" | "warm";
}

export default function Section({ children, className = "", id, tone = "default" }: Props) {
  const bg = tone === "soft" ? "bg-elsai-pin/5" : tone === "warm" ? "bg-elsai-rose/5" : "";
  return (
    <section id={id} className={`py-16 md:py-24 ${bg} ${className}`}>
      <div className="mx-auto max-w-6xl px-4">{children}</div>
    </section>
  );
}
