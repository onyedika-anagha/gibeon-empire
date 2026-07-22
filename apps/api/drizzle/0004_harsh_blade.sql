ALTER TABLE "staff" ADD COLUMN "totp_secret" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "totp_enabled_at" timestamp;