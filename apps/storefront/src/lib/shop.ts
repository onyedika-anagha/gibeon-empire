import { api, type ApiProduct, type Category, type ProductQuery } from "@/lib/api";

export type SearchParams = Record<string, string | undefined>;

export function queryFrom(sp: SearchParams, category?: string): ProductQuery {
  return {
    category: category ?? sp.category,
    size: sp.size,
    color: sp.color,
    q: sp.q,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
  };
}

/** One round trip for the shop pages; either call failing degrades to empty. */
export async function loadShop(query: ProductQuery): Promise<{
  products: ApiProduct[];
  categories: Category[];
  error: boolean;
}> {
  const [products, categories] = await Promise.all([
    api.products(query).catch(() => null),
    api.categories().catch(() => []),
  ]);
  return { products: products ?? [], categories, error: products === null };
}

export const categoryImages = [
  {
    slug: "corporate-wear",
    label: "Corporate Wear",
    image: "https://res.cloudinary.com/diiwcwakk/image/upload/v1784832414/3_qf86ya.webp",
  },
  {
    slug: "casual",
    label: "Casual",
    image: "https://res.cloudinary.com/diiwcwakk/image/upload/v1784832412/2_ept3va.webp",
  },
  {
    slug: "party-wear",
    label: "Party Wear",
    image: "https://res.cloudinary.com/diiwcwakk/image/upload/v1784832309/party-wear_pi6hzd.webp",
  },
  {
    slug: "jeans",
    label: "Jeans",
    image: "https://res.cloudinary.com/diiwcwakk/image/upload/v1784832307/jeans_voaqhk.webp",
  },
  {
    slug: "shoes",
    label: "Shoes",
    image: "https://res.cloudinary.com/diiwcwakk/image/upload/v1784832305/shoes_cgo4sl.webp",
  },
  {
    slug: "bags",
    label: "Bags",
    image: "https://res.cloudinary.com/diiwcwakk/image/upload/v1784830292/bags_oij0n7.webp",
  },
  {
    slug: "hair",
    label: "Hair",
    image: "https://res.cloudinary.com/diiwcwakk/image/upload/v1784832304/hair_vsjyzx.webp",
  },
];
