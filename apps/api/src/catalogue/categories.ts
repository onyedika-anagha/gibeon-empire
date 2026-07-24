/**
 * The fixed Gibeon Empire wardrobe. Categories are a closed set, not free text —
 * the admin picks one, the storefront routes on the slug (/shop/{slug}).
 */
export const CATEGORIES = [
  { slug: "corporate-wear", label: "Corporate Wear" },
  { slug: "casual", label: "Casual" },
  { slug: "party-wear", label: "Party Wear" },
  { slug: "jeans", label: "Jeans" },
  { slug: "shoes", label: "Shoes" },
  { slug: "bags", label: "Bags" },
  { slug: "hair", label: "Hair" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const CATEGORY_SLUGS: string[] = CATEGORIES.map((c) => c.slug);

export const CATEGORY_LABELS = new Map<string, string>(CATEGORIES.map((c) => [c.slug, c.label]));
