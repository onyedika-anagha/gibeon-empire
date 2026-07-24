"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button, Card, Field } from "./ui";

/** Nigerian VAT is 7.5% today, but the rate is policy — keep it editable. */
export default function VatRateCard() {
  const [percent, setPercent] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getTaxRate()
      .then((r) => {
        const p = String(r.vatRateBps / 100);
        setPercent(p);
        setSaved(p);
      })
      .catch(() => toast.error("Could not load the VAT rate"));
  }, []);

  async function save() {
    const bps = Math.round(Number(percent) * 100);
    if (!Number.isFinite(bps) || bps < 0 || bps > 10_000) {
      toast.error("Enter a VAT rate between 0 and 100%");
      return;
    }
    setSaving(true);
    try {
      await api.setTaxRate(bps);
      setSaved(percent);
      toast.success(`VAT set to ${percent}%`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the VAT rate");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mt-4 max-w-md p-6">
      <p className="text-sm font-medium text-foreground">VAT rate</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Added on top of the discounted subtotal at checkout and at the till. Each order stores the
        rate it was charged, so past orders never change.
      </p>
      <div className="mt-4 flex items-end gap-3">
        <div className="w-32">
          <Field label="Rate (%)" type="number" value={percent} onChange={setPercent} />
        </div>
        <Button disabled={saving || percent === saved || percent === ""} onClick={save}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </Card>
  );
}
