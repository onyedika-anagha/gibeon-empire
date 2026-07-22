"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type Review } from "@/lib/api";
import { Button, Card, PageHeader } from "@/components/ui";

const RESOLUTIONS = ["BACKORDER", "SUBSTITUTION", "REFUND"] as const;

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .reviews()
      .then(setReviews)
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  async function resolve(id: string, r: (typeof RESOLUTIONS)[number]) {
    await api.resolveReview(id, r);
    load();
  }

  return (
    <>
      <PageHeader
        title="Oversell reviews"
        subtitle="Offline sales that oversold stock — decide backorder, substitution, or refund."
      />
      {loading ? (
        <p className="text-sm text-slate">Loading…</p>
      ) : reviews.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate">
          Nothing to review. Offline oversell conflicts will surface here.
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="text-sm">
                <p className="font-medium text-ink">
                  {r.quantity}× variant {r.variantId.slice(0, 8)}…
                </p>
                <p className="text-slate">{r.orderReference ?? "offline sale"}</p>
              </div>
              <div className="flex gap-2">
                {RESOLUTIONS.map((res) => (
                  <Button key={res} variant="ghost" onClick={() => resolve(r.id, res)}>
                    {res.charAt(0) + res.slice(1).toLowerCase()}
                  </Button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
