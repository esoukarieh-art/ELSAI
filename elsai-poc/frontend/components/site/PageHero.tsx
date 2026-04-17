import type { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}

export default function PageHero({ eyebrow, title, children }: Props) {
  return (
    <header className="bg-symbiose">
      <div className="max-w-6xl mx-auto px-4 pt-14 pb-16 md:pt-20 md:pb-24">
        {eyebrow && (
          <p className="text-xs uppercase tracking-[0.2em] text-elsai-pin font-semibold mb-4">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-4xl md:text-5xl text-elsai-pin-dark tracking-tight max-w-3xl leading-[1.1]">
          {title}
        </h1>
        {children && (
          <div className="mt-6 text-lg text-elsai-ink/80 max-w-2xl leading-relaxed">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
