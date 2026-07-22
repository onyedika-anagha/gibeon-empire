const COLUMNS = [
  { title: "Shop", links: ["New in", "Dresses", "Outerwear", "Knitwear", "Atelier"] },
  { title: "The House", links: ["Our story", "Sustainability", "Ateliers", "Careers", "Journal"] },
  { title: "Care", links: ["Shipping", "Returns", "Size guide", "Contact", "FAQ"] },
];

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-ink/8 px-4 pb-10 pt-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <a href="#" className="font-display text-2xl tracking-tight text-ink">
              Gibeon<span className="text-gold"> Empire</span>
            </a>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-stone">
              Premium women&apos;s luxury fashion. Effortless essentials,
              thoughtfully made and finished by hand.
            </p>
            <div className="mt-6 flex gap-3">
              {["Instagram", "Pinterest", "TikTok"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="rounded-full px-3.5 py-1.5 text-[12px] text-stone ring-1 ring-ink/10 transition-colors duration-500 hover:bg-ink hover:text-ivory"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] uppercase tracking-[0.18em] text-taupe">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-[14px] text-stone transition-colors duration-300 hover:text-ink"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-ink/8 pt-6 text-[12px] text-taupe sm:flex-row">
          <p>© {new Date().getFullYear()} Gibeon Empire. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-ink">Privacy</a>
            <a href="#" className="hover:text-ink">Terms</a>
            <a href="#" className="hover:text-ink">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
