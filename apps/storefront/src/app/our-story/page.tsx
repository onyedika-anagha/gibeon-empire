import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import SplitFeature from "@/components/SplitFeature";
import { Reveal } from "@/components/motion";

export const metadata: Metadata = {
  title: "Our Story — Gibeon Empire",
  description: "How Gibeon Empire became a home for quiet luxury — three sub-houses, one philosophy.",
};

const STATS: Array<[string, string]> = [
  ["3", "Sub-houses"],
  ["10M+", "Loyal clients"],
  ["24", "Years in service"],
  ["5", "Countries"],
];

export default function OurStoryPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 pt-32 pb-10 md:pt-40">
        <PageHero
          eyebrow="The House"
          title="Built on restraint, not noise."
          blurb="Gibeon Empire began with a simple frustration: luxury that shouted louder than it lasted. Twenty-four years later, we're still making the opposite of that."
        />

        <Reveal delay={0.1}>
          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4">
            {STATS.map(([n, l]) => (
              <div key={l} className="text-center">
                <div className="font-display text-3xl text-ink">{n}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-taupe">{l}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </main>

      <SplitFeature
        eyebrow="How we started"
        title="A wardrobe for women who dress for themselves."
        body="We started with one dress, cut from a fabric that moved the way we wanted, in a colour that didn't fight for attention. It sold out in a week — not because it was loud, but because it was right. That's still the test every piece has to pass."
        image="https://res.cloudinary.com/diiwcwakk/image/upload/v1784829814/5_mztjfk.png"
      />

      <SplitFeature
        eyebrow="How we work"
        title="Three sub-houses, one standard."
        body="Corporate, Party, and Atelier each hold their own point of view, but every piece is finished by the same hands, to the same standard — natural fibres, considered tailoring, and colour palettes built to outlast a season."
        image="https://res.cloudinary.com/diiwcwakk/image/upload/v1784831988/7_jm4mlw.webp"
        reverse
        dark
      />

      <Footer />
    </>
  );
}
