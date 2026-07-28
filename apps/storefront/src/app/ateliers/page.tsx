import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import SplitFeature from "@/components/SplitFeature";

export const metadata: Metadata = {
  title: "Ateliers — Gibeon Empire",
  description: "Inside the ateliers where every Gibeon Empire piece is cut, sewn, and finished by hand.",
};

export default function AteliersPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-32 md:pt-40">
        <PageHero
          eyebrow="The House"
          title="Where every piece is made."
          blurb="Five ateliers across two countries, each specialising in one craft — tailoring, knitwear, leather, and finishing — so nothing leaves half-considered."
        />
      </main>

      <SplitFeature
        eyebrow="Tailoring"
        title="Pattern-cut by hand, fitted in three stages."
        body="Our tailoring atelier still drapes on the form before it drafts a pattern. Every corporate-wear piece passes through three fittings before it's approved for production — the same process whether we're making one sample or five hundred units."
        image="https://res.cloudinary.com/diiwcwakk/image/upload/v1784829826/11_o8z8dj.png"
      />

      <SplitFeature
        eyebrow="Leather & finishing"
        title="Bags and shoes, finished the slow way."
        body="Edges are hand-painted, not machine-sealed. Hardware is sourced from foundries we've worked with for over a decade. It takes longer — a bag can spend three days in finishing alone — but it's the difference our clients notice first."
        image="https://res.cloudinary.com/diiwcwakk/image/upload/v1784832305/shoes_cgo4sl.webp"
        reverse
        dark
      />

      <Footer />
    </>
  );
}
