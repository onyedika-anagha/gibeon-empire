"use client";

import { useSale } from "@/hooks/useSale";
import ProductGrid from "./sale/ProductGrid";
import CartPanel from "./sale/CartPanel";
import PaymentConfirm from "./sale/PaymentConfirm";
import Receipt from "./Receipt";

export default function SaleScreen() {
  const s = useSale();

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[1fr_23rem]">
      <ProductGrid
        results={s.results}
        catalogueEmpty={s.catalogue.length === 0}
        query={s.query}
        onQuery={s.setQuery}
        flash={s.flash}
        onAdd={s.addLine}
      />

      <CartPanel
        cart={s.cart}
        count={s.count}
        subtotal={s.subtotal}
        discount={s.discount}
        total={s.total}
        method={s.method}
        onQty={s.setQty}
        onDiscount={s.setDiscount}
        onMethod={s.setMethod}
        onComplete={s.complete}
      />

      {s.confirming && (
        <PaymentConfirm
          method={s.method}
          total={s.total}
          count={s.count}
          onConfirm={s.confirmPayment}
          onCancel={s.cancelConfirm}
        />
      )}

      {s.receipt && <Receipt sale={s.receipt} onClose={s.clearReceipt} />}
    </div>
  );
}
