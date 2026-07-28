import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import LegalContent from "@/components/LegalContent";

export const metadata: Metadata = {
  title: "Terms of Service — Gibeon Empire",
  description: "The terms that govern shopping with Gibeon Empire.",
};

const SECTIONS = [
  {
    heading: "Orders and payment",
    body: [
      "Placing an order is an offer to buy, which we accept once payment is confirmed and your order is dispatched. Prices are shown in your local currency where available and include applicable taxes at checkout.",
      "We reserve the right to cancel an order — for example if a piece is mistakenly listed as in stock — in which case we'll refund you in full.",
    ],
  },
  {
    heading: "Shipping and returns",
    body: [
      "Delivery times shown at checkout are estimates, not guarantees. Full details on returns and exchanges are on our returns page — unworn pieces can generally be returned within 30 days.",
    ],
  },
  {
    heading: "Product information",
    body: [
      "We describe every piece as accurately as we can, including fabric, fit, and care details. Colours may vary slightly on screen depending on your display.",
    ],
  },
  {
    heading: "Intellectual property",
    body: [
      "All content on this site — photography, designs, and text — belongs to Gibeon Empire and may not be reproduced without permission.",
    ],
  },
  {
    heading: "Limitation of liability",
    body: [
      "We're not liable for indirect or consequential losses arising from use of the site, to the fullest extent permitted by law. Nothing here limits rights you have that can't be excluded under local consumer law.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 pt-32 pb-20 md:pt-40">
        <PageHero eyebrow="Legal" title="Terms of service." />
        <div className="mt-16">
          <LegalContent updated="July 2026" sections={SECTIONS} />
        </div>
      </main>
      <Footer />
    </>
  );
}
