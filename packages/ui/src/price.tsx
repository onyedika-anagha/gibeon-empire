import { cn } from "./cn";

export function formatPrice(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export interface PriceProps {
  value: number;
  compareAt?: number;
  currency?: string;
  className?: string;
}

/** Shared price display: sale price with optional struck-through compare-at. */
export function Price({ value, compareAt, currency, className }: PriceProps) {
  return (
    <div className={cn("flex shrink-0 items-baseline gap-1.5", className)}>
      {compareAt ? (
        <span className="text-[13px] text-taupe line-through">
          {formatPrice(compareAt, currency)}
        </span>
      ) : null}
      <span className="text-[15px] text-ink">{formatPrice(value, currency)}</span>
    </div>
  );
}
