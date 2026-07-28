import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import LegalContent from "@/components/LegalContent";

export const metadata: Metadata = {
  title: "Privacy Policy — Gibeon Empire",
  description: "How Gibeon Empire collects, uses, and protects your personal information.",
};

const SECTIONS = [
  {
    heading: "What we collect",
    body: [
      "When you shop with us or create an account, we collect the details you give us directly — name, email, shipping address, and payment information — along with order history and any preferences you share with our concierge team.",
      "We also collect basic usage data automatically, such as pages viewed and device type, to keep the site running smoothly and understand what our customers are shopping for.",
    ],
  },
  {
    heading: "How we use it",
    body: [
      "We use your information to process orders, provide customer support, and send order updates. With your consent, we also use it to send offers and new-collection announcements — you can unsubscribe at any time.",
      "We never sell your personal information to third parties.",
    ],
  },
  {
    heading: "Who we share it with",
    body: [
      "We share what's necessary with the partners who help us operate — payment processors, shipping carriers, and the tools we use to run our storefront. Each is bound by their own data protection obligations.",
    ],
  },
  {
    heading: "Your choices",
    body: [
      "You can access, correct, or request deletion of your personal data at any time by contacting us. You can also manage your marketing preferences from your account or by using the unsubscribe link in any email.",
    ],
  },
  {
    heading: "Contact us",
    body: [
      "Questions about this policy or your data can be sent to privacy@gibeonempire.com, or through our contact page.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 pt-32 pb-20 md:pt-40">
        <PageHero eyebrow="Legal" title="Privacy policy." />
        <div className="mt-16">
          <LegalContent updated="July 2026" sections={SECTIONS} />
        </div>
      </main>
      <Footer />
    </>
  );
}
