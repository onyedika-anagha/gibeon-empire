CREATE TYPE "public"."review_resolution" AS ENUM('BACKORDER', 'SUBSTITUTION', 'REFUND');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('PENDING', 'RESOLVED');--> statement-breakpoint
CREATE TABLE "oversell_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_client_id" text,
	"variant_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"order_reference" text,
	"status" "review_status" DEFAULT 'PENDING' NOT NULL,
	"resolution" "review_resolution",
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"resolved_by" text
);
--> statement-breakpoint
ALTER TABLE "oversell_reviews" ADD CONSTRAINT "oversell_reviews_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE no action ON UPDATE no action;