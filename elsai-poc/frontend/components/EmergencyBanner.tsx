"use client";

interface Props {
  cta: { label: string; phone: string };
  onClose?: () => void;
}

export default function EmergencyBanner({ cta, onClose }: Props) {
  return (
    <div
      role="alert"
      className="fixed inset-0 z-50 bg-elsai-danger/95 text-white flex flex-col items-center justify-center p-6 text-center"
    >
      <h2 className="text-3xl font-bold mb-4">Tu n'es pas seul·e.</h2>
      <p className="text-lg mb-8 max-w-md">
        Ce que tu vis est important. Un professionnel peut t'aider tout de suite, gratuitement et en toute confidentialité.
      </p>
      <a
        href={`tel:${cta.phone}`}
        className="bg-white text-elsai-danger text-2xl font-bold py-5 px-10 rounded-xl shadow-xl hover:bg-gray-100"
      >
        {cta.label}
      </a>
      {onClose && (
        <button
          onClick={onClose}
          className="mt-6 text-white/80 underline text-sm"
          aria-label="Fermer le bandeau d'urgence"
        >
          Continuer à discuter
        </button>
      )}
    </div>
  );
}
