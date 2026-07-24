"use client";

import { Label } from "@/components/ui/label";
import { useCategories } from "@/hooks/useCategories";

/** Categories are a closed set — chosen, never typed. */
export default function CategorySelect({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (slug: string) => void;
  required?: boolean;
}) {
  const categories = useCategories();

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Category
      </Label>
      <select
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <option value="">Select a category…</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}
