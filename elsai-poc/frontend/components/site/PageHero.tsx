import type { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}

export default function PageHero({ eyebrow, title, children }: Props) {
  return (
    <header className="bg-symbiose">
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-16 md:pt-20 md:pb-24">
        {eyebrow && (
          <p className="text-elsai-pin mb-4 text-xs font-semibold tracking-[0.2em] uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="text-elsai-pin-dark max-w-3xl font-serif text-4xl leading-[1.1] tracking-tight md:text-5xl">
          {title}
        </h1>
        {children && (
          <div className="text-elsai-ink/80 mt-6 max-w-2xl text-lg leading-relaxed">{children}</div>
        )}
      </div>
    </header>
  );
}
