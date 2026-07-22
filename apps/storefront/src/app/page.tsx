import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import CollectionSection from "@/components/CollectionSection";
import EditorialFeature from "@/components/EditorialFeature";
import CategoryGrid from "@/components/CategoryGrid";
import TrustBadges from "@/components/TrustBadges";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import { editorsEdit, seasonEdit } from "@/lib/products";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Marquee />
        <CollectionSection
          id="collections"
          eyebrow="Editor's Edit"
          title="Pieces we're wearing on repeat."
          blurb="Refined silhouettes in soft, considered tones — the quiet backbone of a modern wardrobe."
          products={editorsEdit}
        />
        <EditorialFeature />
        <CollectionSection
          eyebrow="Autumn 2025"
          title="Your go-to picks for the turning season."
          blurb="Effortless layers for every mood — light, calm, and a little unexpected."
          products={seasonEdit}
        />
        <CategoryGrid />
        <TrustBadges />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
