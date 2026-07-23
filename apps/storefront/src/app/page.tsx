import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import CollectionSection from "@/components/CollectionSection";
import EditorialFeature from "@/components/EditorialFeature";
import CategoryGrid from "@/components/CategoryGrid";
import TrustBadges from "@/components/TrustBadges";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import { api, type ApiProduct } from "@/lib/api";

export const dynamic = "force-dynamic"; // homepage reflects the live catalogue

export default async function Home() {
  let products: ApiProduct[] = [];
  try {
    products = await api.products({});
  } catch {
    products = []; // API unreachable — sections below simply hide
  }

  const editors = products.slice(0, 4);
  const arrivals = products.slice(4, 8);
  const categories = [...new Set(products.map((p) => p.category))].slice(0, 4);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Marquee />
        {editors.length > 0 && (
          <CollectionSection
            id="collections"
            eyebrow="Editor's Edit"
            title="Pieces we're wearing on repeat."
            blurb="Refined silhouettes in soft, considered tones — the quiet backbone of a modern wardrobe."
            products={editors}
          />
        )}
        <EditorialFeature />
        {arrivals.length > 0 && (
          <CollectionSection
            eyebrow="New arrivals"
            title="Fresh in from the atelier."
            blurb="The latest pieces to land — effortless layers for every mood."
            products={arrivals}
          />
        )}
        {categories.length > 0 && <CategoryGrid categories={categories} />}
        <TrustBadges />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
