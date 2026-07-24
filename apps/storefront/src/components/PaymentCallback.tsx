"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

type State = "checking" | "paid" | "pending" | "error";

export default function PaymentCallback() {
  const params = useSearchParams();
  // Paystack returns ?reference=/?trxref=, Flutterwave returns ?tx_ref=.
  const reference =
    params.get("reference") ?? params.get("trxref") ?? params.get("tx_ref") ?? "";
  // A missing reference is knowable at render time — no effect needed.
  const [state, setState] = useState<State>(reference ? "checking" : "error");
  const [message, setMessage] = useState(reference ? "" : "No payment reference was returned.");

  useEffect(() => {
    if (!reference) return;

    let cancelled = false;
    let attempt = 0;

    // ponytail: poll a few times — the webhook and our own verify race the redirect.
    async function check() {
      try {
        const res = await api.paymentStatus(reference);
        if (cancelled) return;
        if (res.paid) return setState("paid");
        if (++attempt < 5) return void setTimeout(check, 2000);
        setState("pending");
      } catch (err) {
        if (cancelled) return;
        setState("error");
        setMessage(err instanceof Error ? err.message : "We could not check this payment.");
      }
    }
    void check();

    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <div className="mx-auto max-w-lg text-center">
      <span className="text-[10px] uppercase tracking-[0.24em] text-taupe">Payment</span>
      <h1 className="mt-3 font-display text-4xl tracking-[-0.02em] text-ink">
        {state === "checking" && "Confirming your payment…"}
        {state === "paid" && "Payment received."}
        {state === "pending" && "Still processing."}
        {state === "error" && "We hit a snag."}
      </h1>
      <p className="mt-4 text-[15px] text-stone">
        {state === "checking" && "One moment while we confirm this with your bank."}
        {state === "paid" && (
          <>
            Order <span className="text-ink">{reference}</span> is confirmed. A receipt is on its
            way to your inbox.
          </>
        )}
        {state === "pending" && (
          <>
            We haven&apos;t had confirmation for <span className="text-ink">{reference}</span> yet.
            If you were charged, it will clear shortly and you&apos;ll get an email.
          </>
        )}
        {state === "error" && message}
      </p>
      <Link
        href={state === "paid" ? "/account" : "/shop"}
        className="mt-8 inline-flex rounded-full bg-ink px-7 py-3.5 text-sm text-ivory transition-all duration-500 active:scale-[0.98]"
      >
        {state === "paid" ? "Track your order" : "Continue shopping"}
      </Link>
    </div>
  );
}
