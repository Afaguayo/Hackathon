CREATE TYPE "public"."usage_kind" AS ENUM('tts_chars', 'upload', 'agent_session');--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"kind" "usage_kind" NOT NULL,
	"amount" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "usage_kind_created_idx" ON "usage_events" USING btree ("kind","created_at");--> statement-breakpoint
CREATE INDEX "usage_user_kind_idx" ON "usage_events" USING btree ("user_id","kind","created_at");