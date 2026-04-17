import type { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}

export default function PageHero({ eyebrow, title, children }: Props) {
  return (
    <header className="bg-symbiose">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-14 md:pb-24 md:pt-20">
        {eyebrow && (
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-elsai-pin">
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-3xl font-serif text-4xl leading-[1.1] tracking-tight text-elsai-pin-dark md:text-5xl">
          {title}
        </h1>
        {children && (
          <div className="mt-6 max-w-2xl text-lg leading-relaxed text-elsai-ink/80">{children}</div>
        )}
      </div>
    </header>
  );
}
