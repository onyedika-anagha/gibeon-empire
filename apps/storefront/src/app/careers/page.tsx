import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import StatGrid from "@/components/StatGrid";
import { Reveal } from "@/components/motion";

export const metadata: Metadata = {
  title: "Careers — Gibeon Empire",
  description: "Open roles at Gibeon Empire, across design, ateliers, and retail.",
};

const VALUES = [
  { title: "Craft first", lines: ["We hire people who care about how a seam sits, not just how a season sells."] },
  { title: "Quiet confidence", lines: ["We let the work speak. Titles matter less than the standard you hold yourself to."] },
  { title: "Built to grow", lines: ["Most of our atelier leads and buyers started in an entry-level role here."] },
];

const ROLES = [
  { title: "Senior Pattern Cutter", team: "Tailoring Atelier", location: "Paris" },
  { title: "Retail Concierge", team: "Client Experience", location: "New York" },
  { title: "Sourcing Coordinator", team: "Sustainability", location: "Remote" },
  { title: "Junior Knitwear Designer", team: "Design", location: "Paris" },
];

export default function CareersPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 pt-32 pb-20 md:pt-40">
        <PageHero
          eyebrow="The House"
          title="Come make something that lasts."
          blurb="We're a small team spread across design, ateliers, and retail — and we're always open to hearing from people who care about the craft as much as we do."
        />

        <div className="mt-14">
          <StatGrid items={VALUES} />
        </div>

        <Reveal delay={0.05} className="mx-auto mt-20 max-w-3xl">
          <h2 className="font-display text-2xl text-ink">Open roles</h2>
          <ul className="mt-6 divide-y divide-ink/8 border-y border-ink/8">
            {ROLES.map((r) => (
              <li key={r.title} className="flex flex-wrap items-center justify-between gap-2 py-5">
                <div>
                  <div className="text-[15px] text-ink">{r.title}</div>
                  <div className="mt-0.5 text-[13px] text-taupe">{r.team} · {r.location}</div>
                </div>
                <a
                  href="mailto:careers@gibeonempire.com?subject=Application%20—%20"
                  className="text-[13px] text-ink underline decoration-ink/20 underline-offset-4 transition-colors hover:decoration-ink"
                >
                  Apply
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[13px] text-stone">
            Don't see the right fit?{" "}
            <Link href="/contact" className="text-ink underline decoration-ink/20 underline-offset-4 hover:decoration-ink">
              Get in touch
            </Link>{" "}
            — we keep every note on file for the next opening.
          </p>
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
