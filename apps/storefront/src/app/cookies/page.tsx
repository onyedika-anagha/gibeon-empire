import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import LegalContent from "@/components/LegalContent";

export const metadata: Metadata = {
  title: "Cookie Policy — Gibeon Empire",
  description: "How Gibeon Empire uses cookies to run the storefront and improve your experience.",
};

const SECTIONS = [
  {
    heading: "What cookies do",
    body: [
      "Cookies are small files stored on your device. We use them to keep you signed in, remember your cart and preferences, and understand how the site is used so we can improve it.",
    ],
  },
  {
    heading: "Essential cookies",
    body: [
      "These keep the site working — signing in, holding items in your cart, and completing checkout. The site won't function properly without them, so they can't be turned off.",
    ],
  },
  {
    heading: "Analytics cookies",
    body: [
      "We use these to understand which pages and pieces get the most attention, so we know what to design more of. This data is aggregated and never tied to your identity.",
    ],
  },
  {
    heading: "Managing cookies",
    body: [
      "Most browsers let you block or delete cookies in their settings. Blocking essential cookies may affect your ability to check out or stay signed in.",
    ],
  },
];

export default function CookiesPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 pt-32 pb-20 md:pt-40">
        <PageHero eyebrow="Legal" title="Cookie policy." />
        <div className="mt-16">
          <LegalContent updated="July 2026" sections={SECTIONS} />
        </div>
      </main>
      <Footer />
    </>
  );
}
