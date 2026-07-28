import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Accordion from "@/components/Accordion";
import StatGrid from "@/components/StatGrid";
import { IconGlobe, IconReturn, IconShield } from "@/components/icons";

export const metadata: Metadata = {
  title: "Shipping — Gibeon Empire",
  description: "Delivery times, rates, and international shipping details for Gibeon Empire orders.",
};

const RATES = [
  { region: "Domestic (US)", time: "3–5 business days", cost: "Free over $200, otherwise $12" },
  { region: "Europe & UK", time: "5–8 business days", cost: "From $22" },
  { region: "Rest of world", time: "7–12 business days", cost: "From $32" },
];

const FAQS = [
  {
    q: "When will my order ship?",
    a: "Every order is packed within 1–2 business days of purchase. You'll receive a confirmation email with tracking as soon as it leaves the atelier.",
  },
  {
    q: "Do you offer express shipping?",
    a: "Yes — express delivery (1–3 business days domestically) is available at checkout for an additional fee, calculated by destination.",
  },
  {
    q: "Will I pay customs or import duties?",
    a: "International orders may be subject to local duties and taxes, calculated and charged at checkout so there are no surprises on delivery.",
  },
  {
    q: "Can I change my delivery address after ordering?",
    a: "If your order hasn't shipped yet, contact us immediately and we'll update it where possible. Once it's left the atelier, we're unable to reroute it.",
  },
];

export default function ShippingPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 pt-32 pb-20 md:pt-40">
        <PageHero
          eyebrow="Care"
          title="Shipping."
          blurb="From our atelier to your door — clear rates, tracked delivery, every time."
        />

        <div className="mt-14">
          <StatGrid items={RATES.map((r) => ({ title: r.region, lines: [r.time, r.cost] }))} />
        </div>

        <div className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-x-10 gap-y-3 text-[13px] text-stone">
          <span className="inline-flex items-center gap-2"><IconGlobe className="h-4 w-4 text-gold" /> 40+ countries</span>
          <span className="inline-flex items-center gap-2"><IconShield className="h-4 w-4 text-gold" /> Fully insured</span>
          <span className="inline-flex items-center gap-2"><IconReturn className="h-4 w-4 text-gold" /> Tracked both ways</span>
        </div>

        <div className="mt-20">
          <Accordion items={FAQS} />
        </div>
      </main>
      <Footer />
    </>
  );
}
