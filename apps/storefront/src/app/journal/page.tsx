import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Reveal } from "@/components/motion";

export const metadata: Metadata = {
  title: "Journal — Gibeon Empire",
  description: "Notes from the atelier — fabric, fit, and the thinking behind each Gibeon Empire collection.",
};

const ENTRIES = [
  {
    title: "The case for fewer, better basics",
    excerpt: "Why we design around a ten-piece core instead of a hundred fast trends.",
    tag: "Philosophy",
    image: "https://res.cloudinary.com/diiwcwakk/image/upload/v1784832412/2_ept3va.webp",
  },
  {
    title: "Inside the tailoring atelier",
    excerpt: "Three fittings, one pattern — how a corporate-wear piece actually gets made.",
    tag: "Craft",
    image: "https://res.cloudinary.com/diiwcwakk/image/upload/v1784829826/11_o8z8dj.png",
  },
  {
    title: "A short guide to caring for silk",
    excerpt: "The washing, storing, and repairing habits that add years to a piece.",
    tag: "Care",
    image: "https://res.cloudinary.com/diiwcwakk/image/upload/v1784832307/jeans_voaqhk.webp",
  },
];

export default function JournalPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 pt-32 pb-20 md:pt-40">
        <PageHero
          eyebrow="The House"
          title="The Journal."
          blurb="Notes on fabric, fit, and the thinking behind each collection — from the people who make it."
        />

        <Reveal delay={0.05}>
          <div className="mx-auto mt-16 grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {ENTRIES.map((e) => (
              <article key={e.title} className="group">
                <div
                  className="h-64 overflow-hidden rounded-[1.75rem] bg-cover bg-center ring-1 ring-ink/5 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]"
                  style={{ backgroundImage: `url(${e.image})` }}
                />
                <span className="mt-5 block text-[10px] uppercase tracking-[0.24em] text-taupe">{e.tag}</span>
                <h3 className="mt-2 font-display text-xl text-ink">{e.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-stone">{e.excerpt}</p>
              </article>
            ))}
          </div>
        </Reveal>

        <p className="mx-auto mt-16 max-w-md text-center text-[13px] text-taupe">
          New stories monthly. Join the list on our homepage to get them first.
        </p>
      </main>
      <Footer />
    </>
  );
}
