import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShopView from "@/components/ShopView";
import { api } from "@/lib/api";
import { loadShop, queryFrom, type SearchParams } from "@/lib/shop";

export const dynamic = "force-dynamic"; // live stock + filters

type Props = { params: Promise<{ category: string }>; searchParams: Promise<SearchParams> };

async function labelFor(slug: string): Promise<string | null> {
  const categories = await api.categories().catch(() => []);
  return categories.find((c) => c.slug === slug)?.label ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const label = await labelFor(category);
  return label ? { title: `${label} — Gibeon Empire` } : {};
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ category }, sp] = await Promise.all([params, searchParams]);
  const label = await labelFor(category);
  if (!label) notFound(); // unknown category slug — not a filter, a bad URL

  const { products, categories, error } = await loadShop(queryFrom(sp, category));

  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 pt-32 pb-20 md:pt-40">
        <ShopView
          products={products}
          categories={categories}
          activeCategory={category}
          eyebrow="The Collection"
          title={`${label}.`}
          error={error}
        />
      </main>
      <Footer />
    </>
  );
}
