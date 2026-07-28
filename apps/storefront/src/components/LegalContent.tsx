import { Reveal } from "./motion";

export type LegalSection = { heading: string; body: string[] };

/** Shared prose layout for Privacy, Terms, and Cookies pages. */
export default function LegalContent({ updated, sections }: { updated: string; sections: LegalSection[] }) {
  return (
    <div className="mx-auto max-w-2xl">
      <Reveal>
        <p className="text-center text-[13px] text-taupe">Last updated {updated}</p>
      </Reveal>

      <div className="mt-14 space-y-12">
        {sections.map((s, i) => (
          <Reveal key={s.heading} delay={Math.min(i * 0.04, 0.2)}>
            <h2 className="font-display text-2xl text-ink">{s.heading}</h2>
            <div className="mt-3 space-y-3">
              {s.body.map((p, j) => (
                <p key={j} className="text-[14px] leading-relaxed text-stone">
                  {p}
                </p>
              ))}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
