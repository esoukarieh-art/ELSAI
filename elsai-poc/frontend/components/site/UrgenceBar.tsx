import Link from "next/link";

const NUMBERS = [
  { label: "Enfance en danger", tel: "119", tone: "rose" },
  { label: "Violences femmes", tel: "3919", tone: "rose" },
  { label: "Sans-abri", tel: "115", tone: "pin" },
  { label: "Prévention suicide", tel: "3114", tone: "pin" },
];

export default function UrgenceBar() {
  return (
    <aside
      role="complementary"
      aria-label="Numéros d'urgence gratuits"
      className="bg-elsai-ink text-elsai-creme/90 text-xs md:text-sm"
    >
      <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
        <span className="font-semibold text-elsai-creme">
          En danger, tout de suite ?
        </span>
        {NUMBERS.map((n) => (
          <a
            key={n.tel}
            href={`tel:${n.tel}`}
            className="inline-flex items-center gap-1.5 hover:text-white focus-visible:text-white"
          >
            <span
              aria-hidden
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                n.tone === "rose" ? "bg-elsai-rose-light" : "bg-elsai-pin-light"
              }`}
            />
            <span className="opacity-80">{n.label}</span>
            <span className="font-bold text-white">{n.tel}</span>
          </a>
        ))}
      </div>
    </aside>
  );
}
