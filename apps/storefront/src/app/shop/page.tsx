import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShopView from "@/components/ShopView";
import { loadShop, queryFrom, type SearchParams } from "@/lib/shop";

export const dynamic = "force-dynamic"; // reflects live stock + filters

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const { products, categories, error } = await loadShop(queryFrom(sp));

  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 pt-32 pb-20 md:pt-40">
        <ShopView
          products={products}
          categories={categories}
          activeCategory={sp.category}
          eyebrow={sp.q ? "Search" : "The Collection"}
          title={sp.q ? `Results for “${sp.q}”` : "Shop all pieces."}
          error={error}
        />
      </main>
      <Footer />
    </>
  );
}
