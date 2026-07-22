CREATE TYPE "public"."pos_sale_status" AS ENUM('COMMITTED', 'FLAGGED');--> statement-breakpoint
CREATE TABLE "pos_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" text NOT NULL,
	"order_id" uuid,
	"status" "pos_sale_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pos_sales_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
ALTER TABLE "pos_sales" ADD CONSTRAINT "pos_sales_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;