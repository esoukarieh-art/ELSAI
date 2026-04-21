interface Step {
  name: string;
  text: string;
}

interface Props {
  steps: Step[];
  title?: string;
}

export function HowToSteps({ steps, title }: Props) {
  if (!steps || steps.length === 0) return null;
  return (
    <section className="my-8">
      {title && (
        <h2 className="text-elsai-pin-dark mb-4 font-serif text-xl md:text-2xl">{title}</h2>
      )}
      <ol className="space-y-4">
        {steps.map((step, i) => (
          <li
            key={i}
            className="rounded-organic border-elsai-pin/15 border p-4"
          >
            <div className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
              Étape {i + 1}
            </div>
            <div className="text-elsai-pin-dark mt-1 font-semibold">{step.name}</div>
            <div className="text-elsai-ink/80 mt-2 leading-relaxed">{step.text}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}
