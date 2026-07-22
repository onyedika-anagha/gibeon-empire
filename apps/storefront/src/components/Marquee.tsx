const ITEMS = [
  "Complimentary worldwide shipping",
  "Hand-finished in the atelier",
  "30-day effortless returns",
  "Members earn early access",
  "Ethically sourced fabrics",
];

export default function Marquee() {
  return (
    <div className="overflow-hidden border-y border-ink/8 bg-ink py-3.5 text-ivory">
      <div className="flex w-max animate-marquee whitespace-nowrap">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex items-center" aria-hidden={dup === 1}>
            {ITEMS.map((t) => (
              <span key={t} className="flex items-center text-[12px] uppercase tracking-[0.22em] text-ivory/80">
                <span className="px-8">{t}</span>
                <span className="text-gold">✶</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
