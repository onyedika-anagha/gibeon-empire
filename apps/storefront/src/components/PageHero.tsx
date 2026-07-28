import type { ReactNode } from "react";
import { Reveal } from "./motion";

/** Shared interior-page header — eyebrow, title, optional blurb. */
export default function PageHero({
  eyebrow,
  title,
  blurb,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  blurb?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <Reveal>
        <span className="text-[10px] uppercase tracking-[0.24em] text-taupe">{eyebrow}</span>
        <h1 className="mt-3 font-display text-5xl leading-[1.02] tracking-[-0.02em] text-ink md:text-6xl">
          {title}
        </h1>
        {blurb && <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-stone">{blurb}</p>}
        {children}
      </Reveal>
    </div>
  );
}
