"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { EASE } from "./motion";

const TOPICS = ["An order", "Sizing & fit", "Returns & exchanges", "Wholesale & press", "Something else"];

export default function ContactForm() {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="rounded-[2rem] bg-ivory/60 p-10 text-center ring-1 ring-ink/5"
      >
        <span className="text-[10px] uppercase tracking-[0.24em] text-gold">Message sent</span>
        <h3 className="mt-3 font-display text-2xl text-ink">Thank you for writing in.</h3>
        <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-stone">
          Our concierge team replies within one business day. Keep an eye on your inbox.
        </p>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="space-y-5 rounded-[2rem] bg-ivory/60 p-8 ring-1 ring-ink/5 md:p-10"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name">
          <input id="name" name="name" required placeholder="Jane Doe" className={inputClass} />
        </Field>
        <Field label="Email address" htmlFor="email">
          <input id="email" name="email" type="email" required placeholder="jane@email.com" className={inputClass} />
        </Field>
      </div>

      <Field label="What's this about" htmlFor="topic">
        <select
          id="topic"
          name="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className={`${inputClass} appearance-none`}
        >
          {TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>

      <Field label="Message" htmlFor="message">
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="How can we help?"
          className={`${inputClass} resize-none`}
        />
      </Field>

      <button
        type="submit"
        className="group inline-flex items-center gap-3 rounded-full bg-ink py-3 pl-6 pr-2.5 text-sm text-ivory transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]"
      >
        Send message
        <span className="grid h-8 w-8 place-items-center rounded-full bg-ivory/15 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5">
          →
        </span>
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl bg-ivory px-4 py-3 text-[14px] text-ink ring-1 ring-ink/10 placeholder:text-taupe focus:outline-none focus:ring-ink/25 transition-all duration-300";

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-taupe">{label}</span>
      {children}
    </label>
  );
}
