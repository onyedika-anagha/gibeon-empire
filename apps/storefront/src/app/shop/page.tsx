import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShopFilters from "@/components/ShopFilters";
import StoreProductCard from "@/components/StoreProductCard";
import { Reveal, Stagger } from "@/components/motion";
import { api, type ProductQuery } from "@/lib/api";

export const dynamic = "force-dynamic"; // reflects live stock + filters

type SP = Promise<Record<string, string | undefined>>;

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const query: ProductQuery = {
    category: sp.category,
    size: sp.size,
    color: sp.color,
    q: sp.q,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
  };

  let products = [] as Awaited<ReturnType<typeof api.products>>;
  let error = false;
  try {
    products = await api.products(query);
  } catch {
    error = true;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 pt-32 pb-20 md:pt-40">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <span className="text-[10px] uppercase tracking-[0.24em] text-taupe">The Collection</span>
            <h1 className="mt-3 font-display text-5xl leading-[1.02] tracking-[-0.02em] text-ink md:text-6xl">
              Shop all pieces.
            </h1>
          </Reveal>

          <div className="mt-10">
            <ShopFilters />
          </div>

          {error ? (
            <p className="mt-20 text-center text-sm text-taupe">
              Unable to load the collection. Please try again shortly.
            </p>
          ) : products.length === 0 ? (
            <p className="mt-20 text-center text-sm text-taupe">
              No pieces match your filters yet.
            </p>
          ) : (
            <Stagger className="mt-12 grid grid-cols-2 gap-5 md:grid-cols-3 md:gap-8 lg:grid-cols-4">
              {products.map((p) => (
                <StoreProductCard key={p.id} p={p} />
              ))}
            </Stagger>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
