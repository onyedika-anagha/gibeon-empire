import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import { Reveal } from "@/components/motion";
import { IconMail, IconPin, IconPhone, IconChat } from "@/components/icons";

export const metadata: Metadata = {
  title: "Contact — Gibeon Empire",
  description: "Get in touch with the Gibeon Empire concierge team — orders, sizing, returns, or anything else.",
};

const CHANNELS = [
  { icon: IconMail, label: "Email", value: "concierge@gibeonempire.com" },
  { icon: IconPhone, label: "Phone", value: "+1 (212) 555-0148" },
  { icon: IconPin, label: "Atelier", value: "14 Rue de Sèvres, Paris, France" },
  { icon: IconChat, label: "Hours", value: "Mon–Fri, 9am–6pm CET" },
];

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 pt-32 pb-20 md:pt-40">
        <PageHero
          eyebrow="Get in touch"
          title="We're here to help."
          blurb="Questions about an order, sizing, or an upcoming piece — our concierge team replies within one business day."
        />

        <div className="mx-auto mt-16 grid max-w-5xl gap-10 md:grid-cols-[1fr_1.3fr]">
          <Reveal delay={0.05}>
            <ul className="space-y-6">
              {CHANNELS.map(({ icon: Icon, label, value }) => (
                <li key={label} className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink/5 text-ink">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.14em] text-taupe">{label}</div>
                    <div className="mt-0.5 text-[15px] text-ink">{value}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <ContactForm />
          </Reveal>
        </div>
      </main>
      <Footer />
    </>
  );
}
