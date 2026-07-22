"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { api, type Order } from "@/lib/api";
import { formatMoney } from "@/lib/format";

type Status = "idle" | "placing" | "done" | "error";

export default function CheckoutForm() {
  const { items, subtotal, clear } = useCart();
  const { token, email: authEmail, register } = useAuth();

  const [email, setEmail] = useState(authEmail ?? "");
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [payUrl, setPayUrl] = useState("");

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setStatus("placing");
    setError("");
    try {
      // Optional account is created BEFORE the order so it links to the customer (PRD Req. 6, 7).
      let activeToken = token ?? undefined;
      if (!activeToken && createAccount) {
        activeToken = await register({ email, firstName, lastName, password });
      }

      const placed = await api.createOrder(
        {
          channel: "ONLINE",
          contactEmail: email,
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        },
        activeToken,
      );
      const payment = await api.initializePayment(placed.id);

      setOrder(placed);
      setPayUrl(payment.authorizationUrl);
      setStatus("done");
      clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "done" && order) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <span className="text-[10px] uppercase tracking-[0.24em] text-taupe">Order placed</span>
        <h1 className="mt-3 font-display text-4xl tracking-[-0.02em] text-ink">Thank you.</h1>
        <p className="mt-4 text-[15px] text-stone">
          Your order <span className="text-ink">{order.reference}</span> has been received. A
          confirmation is on its way to {order.contactEmail}.
        </p>
        <a
          href={payUrl}
          className="mt-8 inline-flex rounded-full bg-ink px-7 py-3.5 text-sm text-ivory transition-all duration-500 active:scale-[0.98]"
        >
          Complete payment
        </a>
        <div className="mt-6 text-[13px] text-taupe">
          {token ? (
            <Link href="/account" className="underline hover:text-ink">
              Track it in your account →
            </Link>
          ) : (
            <Link href="/shop" className="underline hover:text-ink">
              Continue shopping →
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-4xl tracking-[-0.02em] text-ink">Your bag is empty.</h1>
        <Link href="/shop" className="mt-6 inline-flex rounded-full bg-ink px-7 py-3.5 text-sm text-ivory">
          Explore the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={placeOrder} className="order-2 md:order-1">
        <h1 className="font-display text-4xl tracking-[-0.02em] text-ink">Checkout</h1>
        <p className="mt-2 text-[14px] text-stone">
          {token ? `Signed in as ${authEmail}.` : "Checking out as a guest — no account required."}
        </p>

        <div className="mt-8 space-y-4">
          <Field label="Email" type="email" value={email} onChange={setEmail} required disabled={!!token} />

          {!token && (
            <label className="flex items-center gap-3 pt-1 text-[14px] text-stone">
              <input
                type="checkbox"
                checked={createAccount}
                onChange={(e) => setCreateAccount(e.target.checked)}
                className="h-4 w-4 accent-[color:var(--color-ink)]"
              />
              Save my details for faster checkout next time
            </label>
          )}

          {!token && createAccount && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" value={firstName} onChange={setFirst} required />
              <Field label="Last name" value={lastName} onChange={setLast} required />
              <div className="sm:col-span-2">
                <Field label="Password" type="password" value={password} onChange={setPassword} required minLength={8} />
              </div>
            </div>
          )}
        </div>

        {error && <p className="mt-4 text-[13px] text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={status === "placing"}
          className="mt-8 w-full rounded-full bg-ink py-3.5 text-sm text-ivory transition-all duration-500 active:scale-[0.98] disabled:opacity-60"
        >
          {status === "placing" ? "Placing order…" : `Place order · ${formatMoney(subtotal)}`}
        </button>
      </form>

      <aside className="order-1 h-fit rounded-[1.75rem] bg-ivory/60 p-6 ring-1 ring-ink/5 md:order-2">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-taupe">Order summary</h2>
        <ul className="mt-4 space-y-3">
          {items.map((i) => (
            <li key={i.variantId} className="flex justify-between gap-3 text-[14px]">
              <span className="text-stone">
                {i.name} <span className="text-taupe">×{i.quantity}</span>
              </span>
              <span className="text-ink">{formatMoney(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-between border-t border-ink/8 pt-4">
          <span className="text-sm text-stone">Subtotal</span>
          <span className="font-display text-xl text-ink">{formatMoney(subtotal)}</span>
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  disabled,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.14em] text-taupe">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        minLength={minLength}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl bg-ivory px-4 py-3 text-sm text-ink ring-1 ring-ink/10 focus:outline-none focus:ring-ink/30 disabled:opacity-60"
      />
    </label>
  );
}
