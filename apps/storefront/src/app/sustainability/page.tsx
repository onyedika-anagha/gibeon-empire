import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import SplitFeature from "@/components/SplitFeature";
import StatGrid from "@/components/StatGrid";

export const metadata: Metadata = {
  title: "Sustainability — Gibeon Empire",
  description: "How Gibeon Empire sources fabric, treats its ateliers, and designs for a longer wardrobe life.",
};

const COMMITMENTS = [
  { title: "Natural fibres", lines: ["Wool, silk, linen, and organic cotton account for the majority of what we cut each season."] },
  { title: "Made to last", lines: ["Every piece is designed and tested to outlive a single season — repairable seams, reinforced closures."] },
  { title: "Fair ateliers", lines: ["Our partner workshops are audited annually for wages, hours, and working conditions."] },
];

export default function SustainabilityPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 pt-32 pb-10 md:pt-40">
        <PageHero
          eyebrow="The House"
          title="Fewer pieces, made properly."
          blurb="We don't chase trend cycles. Slower design means fabric we trust, ateliers we know by name, and clothes built to be worn for years — not seasons."
        />

        <div className="mt-14">
          <StatGrid items={COMMITMENTS} />
        </div>
      </main>

      <SplitFeature
        eyebrow="Sourcing"
        title="We ask where everything comes from."
        body="Every fabric is traced back to its mill. We favour natural fibres that age well and biodegrade responsibly over synthetics built to be discarded — and we say no to a print or finish if we can't stand behind how it was made."
        image="https://res.cloudinary.com/diiwcwakk/image/upload/v1784832414/3_qf86ya.webp"
      />

      <SplitFeature
        eyebrow="The long term"
        title="Care instructions that actually extend a garment's life."
        body="Every piece ships with fabric-specific care notes, and our concierge team will always help you repair rather than replace. A wardrobe you keep is the most sustainable one there is."
        image="https://res.cloudinary.com/diiwcwakk/image/upload/v1784830292/bags_oij0n7.webp"
        reverse
        dark
      />

      <Footer />
    </>
  );
}
