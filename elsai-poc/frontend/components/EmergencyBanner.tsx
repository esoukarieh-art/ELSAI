"use client";

interface Props {
  cta: { label: string; phone: string };
  onClose?: () => void;
}

export default function EmergencyBanner({ cta, onClose }: Props) {
  return (
    <div
      role="alert"
      className="fixed inset-0 z-50 bg-elsai-urgence/95 text-elsai-creme flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm"
    >
      <h2 className="text-3xl md:text-4xl font-serif mb-4">
        Tu n'es pas seul·e.
      </h2>
      <p className="text-lg mb-8 max-w-md leading-relaxed">
        Ce que tu vis est important. Un professionnel peut t'aider tout de suite,
        gratuitement et en toute confidentialité.
      </p>
      <a
        href={`tel:${cta.phone}`}
        className="bg-elsai-creme text-elsai-urgence text-2xl font-bold py-5 px-10 rounded-organic shadow-xl hover:bg-white transition-colors"
      >
        {cta.label}
      </a>
      {onClose && (
        <button
          onClick={onClose}
          className="mt-6 text-elsai-creme/80 underline text-sm"
          aria-label="Fermer le bandeau d'urgence"
        >
          Continuer à discuter
        </button>
      )}
    </div>
  );
}
