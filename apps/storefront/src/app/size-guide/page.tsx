import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Accordion from "@/components/Accordion";
import { Reveal } from "@/components/motion";

export const metadata: Metadata = {
  title: "Size Guide — Gibeon Empire",
  description: "Find your size at Gibeon Empire — measurements in inches and centimetres for every size.",
};

const SIZES = [
  { size: "XS", bust: '32" / 81cm', waist: '25" / 63cm', hip: '35" / 89cm' },
  { size: "S", bust: '34" / 86cm', waist: '27" / 68cm', hip: '37" / 94cm' },
  { size: "M", bust: '36" / 91cm', waist: '29" / 73cm', hip: '39" / 99cm' },
  { size: "L", bust: '38" / 96cm', waist: '31" / 78cm', hip: '41" / 104cm' },
  { size: "XL", bust: '40" / 101cm', waist: '33" / 83cm', hip: '43" / 109cm' },
];

const FAQS = [
  {
    q: "How do I take my measurements?",
    a: "Bust: measure around the fullest part. Waist: measure the narrowest point, usually just above the navel. Hip: measure around the fullest part, about 8 inches below your waist.",
  },
  {
    q: "What if I'm between sizes?",
    a: "We generally recommend sizing up for a softer, more relaxed fit — most of our pieces are cut close to the body. Reach out and we'll advise on the specific style.",
  },
  {
    q: "Do sizes vary between styles?",
    a: "Cut and drape vary slightly by fabric and silhouette. Each product page lists fit notes specific to that piece alongside these general measurements.",
  },
];

export default function SizeGuidePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 pt-32 pb-20 md:pt-40">
        <PageHero
          eyebrow="Care"
          title="Size guide."
          blurb="General measurements across our collection. Individual product pages note any fit differences."
        />

        <Reveal delay={0.05} className="mx-auto mt-14 max-w-3xl overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-ink/10 text-[11px] uppercase tracking-[0.14em] text-taupe">
                <th className="py-3 pr-4 font-normal">Size</th>
                <th className="py-3 pr-4 font-normal">Bust</th>
                <th className="py-3 pr-4 font-normal">Waist</th>
                <th className="py-3 font-normal">Hip</th>
              </tr>
            </thead>
            <tbody>
              {SIZES.map((row) => (
                <tr key={row.size} className="border-b border-ink/5">
                  <td className="py-3.5 pr-4 text-ink">{row.size}</td>
                  <td className="py-3.5 pr-4 text-stone">{row.bust}</td>
                  <td className="py-3.5 pr-4 text-stone">{row.waist}</td>
                  <td className="py-3.5 text-stone">{row.hip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>

        <div className="mt-20">
          <Accordion items={FAQS} />
        </div>
      </main>
      <Footer />
    </>
  );
}
