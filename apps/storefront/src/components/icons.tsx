// Ultra-light hairline icons (Phosphor-style, 1.4 stroke). No icon dependency.
type P = { className?: string };
const base = "1.4";

export const IconSearch = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={base} />
    <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
  </svg>
);

export const IconBag = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M6 8h12l-.8 11.2a1 1 0 0 1-1 .8H7.8a1 1 0 0 1-1-.8L6 8Z" stroke="currentColor" strokeWidth={base} strokeLinejoin="round" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
  </svg>
);

export const IconHeart = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M12 20s-7-4.35-7-9.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5C19 15.65 12 20 12 20Z" stroke="currentColor" strokeWidth={base} strokeLinejoin="round" />
  </svg>
);

export const IconUser = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth={base} />
    <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
  </svg>
);

export const IconArrow = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconArrowUpRight = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconShield = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M12 3.5 5 6v5c0 4.5 3 7.8 7 9.5 4-1.7 7-5 7-9.5V6l-7-2.5Z" stroke="currentColor" strokeWidth={base} strokeLinejoin="round" />
    <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconReturn = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M4 9a8 8 0 1 1-1.2 4.3" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
    <path d="M4 4v5h5" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconGlobe = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth={base} />
    <path d="M3.5 12h17M12 3.5c2.5 2.4 2.5 14.6 0 17M12 3.5c-2.5 2.4-2.5 14.6 0 17" stroke="currentColor" strokeWidth={base} />
  </svg>
);

export const IconChat = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M5 6h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4 3v-3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth={base} strokeLinejoin="round" />
  </svg>
);
