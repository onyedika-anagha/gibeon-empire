"use client";

import { Stagger, staggerItem } from "./motion";
import { motion } from "motion/react";
import { IconShield, IconReturn, IconGlobe, IconChat } from "./icons";

const ITEMS = [
  { icon: IconShield, title: "Secure checkout", body: "Encrypted, protected payments on every order." },
  { icon: IconReturn, title: "Easy returns", body: "Changed your mind? 30 days, stress-free." },
  { icon: IconGlobe, title: "Worldwide delivery", body: "From our atelier to your doorstep." },
  { icon: IconChat, title: "Here to help", body: "A concierge team, always happy to chat." },
];

export default function TrustBadges() {
  return (
    <section className="px-4 py-8">
      <Stagger className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, body }) => (
          <motion.div
            key={title}
            variants={staggerItem}
            className="rounded-[1.5rem] bg-ivory/60 p-6 ring-1 ring-ink/5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_30px_60px_-40px_rgba(31,27,23,0.5)]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-ink/5 text-ink">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-[15px] text-ink">{title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-stone">{body}</p>
          </motion.div>
        ))}
      </Stagger>
    </section>
  );
}
