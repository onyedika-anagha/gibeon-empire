"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, PageHeader } from "@/components/ui";
import Pager from "@/components/Pager";
import ProductRow from "./ProductRow";
import ProductDialog from "./ProductDialog";
import { api, type AdminProduct } from "@/lib/api";

const PAGE_SIZE = 10;

export default function ProductList() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    api
      .products()
      .then(setProducts)
      .catch((e) => {
        setProducts([]);
        toast.error(e instanceof Error ? e.message : "Could not load products");
      });
  }, []);
  useEffect(load, [load]);

  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const current = Math.min(page, pageCount); // a shrinking list must not strand us
  const visible = products.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="The only place products, variants, and SKUs are created."
        action={<Button onClick={() => setCreating(true)}>New product</Button>}
      />

      <div className="mt-6 space-y-3">
        {products.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No products yet.</p>
        ) : (
          visible.map((p) => <ProductRow key={p.id} product={p} onSaved={load} />)
        )}
      </div>

      <Pager page={current} pageCount={pageCount} onPage={setPage} />

      {creating && <ProductDialog key="new" open onOpenChange={setCreating} onSaved={load} />}
    </>
  );
}
