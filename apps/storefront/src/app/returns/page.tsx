import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Accordion from "@/components/Accordion";
import StepList from "@/components/StepList";

export const metadata: Metadata = {
  title: "Returns — Gibeon Empire",
  description: "How to return or exchange a Gibeon Empire order — free within 30 days.",
};

const STEPS = [
  ["01", "Start your return", "Sign in to your account and select the order you'd like to return, or email us your order number."],
  ["02", "Pack it up", "Fold the piece back into its original packaging with tags attached — we'll email you a prepaid label."],
  ["03", "Drop it off", "Hand it to any courier drop point. We'll confirm by email once it's on its way back to us."],
  ["04", "Get refunded", "Once received and inspected, your refund is issued to the original payment method within 5 business days."],
];

const FAQS = [
  {
    q: "How long do I have to return an item?",
    a: "30 days from the delivery date. Items must be unworn, unwashed, and with all original tags attached.",
  },
  {
    q: "Is return shipping free?",
    a: "Yes, domestic returns ship free using the prepaid label we email you. International return shipping is deducted from the refund unless the return is due to our error.",
  },
  {
    q: "Which items can't be returned?",
    a: "Final-sale pieces, made-to-order items, and earrings for hygiene reasons. These are always marked clearly on the product page before you buy.",
  },
  {
    q: "Can I exchange instead of refund?",
    a: "Yes — choose exchange when starting your return and we'll prioritize sending your new size or colour once the original is on its way to us.",
  },
];

export default function ReturnsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 pt-32 pb-20 md:pt-40">
        <PageHero
          eyebrow="Care"
          title="Returns & exchanges."
          blurb="Changed your mind? Unworn pieces can be returned free within 30 days — no questions asked."
        >
          <Link
            href="/account"
            className="mt-7 inline-flex items-center rounded-full bg-ink px-6 py-3 text-sm text-ivory transition-all duration-500 active:scale-[0.98]"
          >
            Start a return
          </Link>
        </PageHero>

        <div className="mt-16">
          <StepList steps={STEPS.map(([n, title, body]) => ({ n, title, body }))} />
        </div>

        <div className="mt-20">
          <Accordion items={FAQS} />
        </div>
      </main>
      <Footer />
    </>
  );
}
