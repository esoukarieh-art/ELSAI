"use client";

interface Props {
  cta: { label: string; phone: string };
  thirdParty?: boolean;
  onClose?: () => void;
}

export default function EmergencyBanner({ cta, thirdParty = false, onClose }: Props) {
  const heading = thirdParty
    ? "Pour votre proche, des professionnels peuvent aider."
    : "Tu n'es pas seul·e.";
  const body = thirdParty
    ? "Une situation comme celle-ci mérite un avis professionnel. Cette ligne est gratuite, confidentielle, et conçue pour accompagner les proches autant que les enfants concernés."
    : "Ce que tu vis est important. Un professionnel peut t'aider tout de suite, gratuitement et en toute confidentialité.";
  return (
    <div
      role={thirdParty ? "status" : "alert"}
      className="bg-elsai-urgence/95 text-elsai-creme fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm"
    >
      <h2 className="mb-4 font-serif text-3xl md:text-4xl">{heading}</h2>
      <p className="mb-8 max-w-md text-lg leading-relaxed">{body}</p>
      <a
        href={`tel:${cta.phone}`}
        className="rounded-organic bg-elsai-creme text-elsai-urgence px-10 py-5 text-2xl font-bold shadow-xl transition-colors hover:bg-white"
      >
        {cta.label}
      </a>
      {onClose && (
        <button
          onClick={onClose}
          className="text-elsai-creme/80 mt-6 text-sm underline"
          aria-label="Fermer le bandeau d'urgence"
        >
          Continuer à discuter
        </button>
      )}
    </div>
  );
}
