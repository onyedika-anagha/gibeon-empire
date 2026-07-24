ALTER TABLE "orders" ADD COLUMN "tax_total" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tax_rate_bps" integer DEFAULT 0 NOT NULL;