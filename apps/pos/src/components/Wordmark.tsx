import Monogram from "./Monogram";

// Brand lockup: gold monogram + "Gibeon POS" wordmark. Sizes with `compact`.
export default function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Monogram className={`text-gold ${compact ? "h-7 w-7" : "h-9 w-9"}`} />
      <div className={`font-semibold tracking-tight text-fg ${compact ? "text-lg" : "text-xl"}`}>
        Gibeon<span className="text-gold"> POS</span>
      </div>
    </div>
  );
}
