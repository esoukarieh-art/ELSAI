const NUMBERS = [
  { label: "Enfance en danger", tel: "119", tone: "rose" },
  { label: "Violences faites aux femmes", tel: "3919", tone: "rose" },
  { label: "Sans-abri", tel: "115", tone: "pin" },
  { label: "Prévention du suicide", tel: "3114", tone: "pin" },
];

export default function UrgenceBar() {
  return (
    <aside
      aria-labelledby="urgence-heading"
      className="bg-elsai-ink text-elsai-creme text-xs md:text-sm"
    >
      <h2 id="urgence-heading" className="sr-only">
        Numéros d'urgence gratuits, disponibles 24h/24
      </h2>
      <ul
        role="list"
        className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1"
      >
        <li className="font-semibold text-elsai-creme" aria-hidden="true">
          En danger, tout de suite ?
        </li>
        {NUMBERS.map((n) => (
          <li key={n.tel}>
            <a
              href={`tel:${n.tel}`}
              aria-label={`Appeler le ${n.tel} — ${n.label}, numéro gratuit`}
              className="inline-flex items-center gap-1.5 hover:text-white focus-visible:text-white rounded-sm"
            >
              <span
                aria-hidden="true"
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  n.tone === "rose" ? "bg-elsai-rose-light" : "bg-elsai-pin-light"
                }`}
              />
              <span aria-hidden="true" className="text-elsai-creme/90">
                {n.label}
              </span>
              <span aria-hidden="true" className="font-bold text-white">
                {n.tel}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
