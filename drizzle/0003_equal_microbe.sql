ALTER TYPE "public"."usage_kind" ADD VALUE 'ai_request';--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "content" jsonb;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "chapter_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "paragraph_count" integer DEFAULT 0 NOT NULL;