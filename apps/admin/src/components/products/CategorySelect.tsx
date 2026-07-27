"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      <Select name="category" value={value || undefined} onValueChange={onChange} required={required}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a category…" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((c) => (
            <SelectItem key={c.slug} value={c.slug}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
