ALTER TABLE "documents" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "source" text;--> statement-breakpoint
CREATE INDEX "documents_public_idx" ON "documents" USING btree ("is_public");