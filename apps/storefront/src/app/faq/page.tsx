import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Accordion from "@/components/Accordion";

export const metadata: Metadata = {
  title: "FAQ — Gibeon Empire",
  description: "Answers to common questions about orders, shipping, returns, sizing, and care at Gibeon Empire.",
};

const FAQS = [
  {
    q: "How long does delivery take?",
    a: "Orders ship within 1–2 business days. Standard delivery takes 3–5 business days domestically and 7–12 internationally. Express options are available at checkout.",
  },
  {
    q: "What's your returns policy?",
    a: "Unworn pieces with tags attached can be returned within 30 days of delivery for a full refund. Final-sale and made-to-order items are excluded — this is flagged on the product page.",
  },
  {
    q: "How do I find my size?",
    a: "Each product page lists measurements against our size guide. If you're between sizes, we generally recommend sizing up for a softer, more relaxed fit — reach out and we'll advise on the specific piece.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes, we ship to over 40 countries. Duties and taxes are calculated at checkout so there are no surprise charges on delivery.",
  },
  {
    q: "Can I change or cancel my order?",
    a: "We pack orders quickly, so changes are only possible within an hour of purchase. Contact us right away and we'll do what we can before it leaves the atelier.",
  },
  {
    q: "How do I care for my pieces?",
    a: "Every item ships with a care label specific to its fabric. As a rule, we recommend cold hand-washing or dry cleaning delicate fabrics, and always air-drying flat to protect shape.",
  },
  {
    q: "Do you offer exchanges?",
    a: "Yes — request an exchange through the returns process and we'll prioritize dispatching your new size or colour as soon as the original is on its way back to us.",
  },
  {
    q: "How can I track my order?",
    a: "You'll receive a tracking link by email as soon as your order ships. Signed-in customers can also view order status anytime from their account.",
  },
];

export default function FaqPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 pt-32 pb-20 md:pt-40">
        <PageHero
          eyebrow="Support"
          title="Frequently asked questions."
          blurb="Can't find what you're looking for? Our concierge team is a message away."
        />
        <div className="mt-16">
          <Accordion items={FAQS} />
        </div>
      </main>
      <Footer />
    </>
  );
}
