import ShopFilters from "@/components/ShopFilters";
import StoreProductCard from "@/components/StoreProductCard";
import { Reveal, Stagger } from "@/components/motion";
import type { ApiProduct, Category } from "@/lib/api";

/** Shared body of /shop and /shop/[category] — only the heading differs. */
export default function ShopView({
  products,
  categories,
  activeCategory,
  eyebrow,
  title,
  error,
}: {
  products: ApiProduct[];
  categories: Category[];
  activeCategory?: string;
  eyebrow: string;
  title: string;
  error?: boolean;
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <Reveal>
        <span className="text-[10px] uppercase tracking-[0.24em] text-taupe">{eyebrow}</span>
        <h1 className="mt-3 font-display text-5xl leading-[1.02] tracking-[-0.02em] text-ink md:text-6xl">
          {title}
        </h1>
      </Reveal>

      <div className="mt-10">
        <ShopFilters categories={categories} activeCategory={activeCategory} />
      </div>

      {error ? (
        <p className="mt-20 text-center text-sm text-taupe">
          Unable to load the collection. Please try again shortly.
        </p>
      ) : products.length === 0 ? (
        <p className="mt-20 text-center text-sm text-taupe">No pieces match your filters yet.</p>
      ) : (
        <Stagger className="mt-12 grid grid-cols-2 gap-5 md:grid-cols-3 md:gap-8 lg:grid-cols-4">
          {products.map((p) => (
            <StoreProductCard key={p.id} p={p} />
          ))}
        </Stagger>
      )}
    </div>
  );
}
