import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaymentCallback from "@/components/PaymentCallback";

export default function PaymentCallbackPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 pt-32 pb-24 md:pt-40">
        {/* useSearchParams needs a boundary — the shell prerenders, the status doesn't. */}
        <Suspense
          fallback={
            <p className="mx-auto max-w-lg text-center text-[15px] text-stone">
              Confirming your payment…
            </p>
          }
        >
          <PaymentCallback />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
