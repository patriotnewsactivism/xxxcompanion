CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"mode" text DEFAULT 'single' NOT NULL,
	"title" text DEFAULT 'New conversation' NOT NULL,
	"persona_ids" text DEFAULT '[]' NOT NULL,
	"short_term" text DEFAULT '[]' NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "memories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"kind" text NOT NULL,
	"key" text NOT NULL,
	"content" text NOT NULL,
	"embedding" text,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"speaker_token" text DEFAULT 'companion' NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"moderation_status" text DEFAULT 'allowed' NOT NULL,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "personas" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text NOT NULL,
	"genre" text NOT NULL,
	"relationship_dynamic" text NOT NULL,
	"tone" text NOT NULL,
	"definition" text NOT NULL,
	"appearance" text,
	"pronouns" text,
	"kinks" text DEFAULT '[]' NOT NULL,
	"hard_limits" text DEFAULT '[]' NOT NULL,
	"soft_limits" text DEFAULT '[]' NOT NULL,
	"scene" text,
	"explicitness" integer DEFAULT 3 NOT NULL,
	"narrative_style" text DEFAULT 'second' NOT NULL,
	"response_length" text DEFAULT 'balanced' NOT NULL,
	"greeting" text,
	"voice_config" text,
	"avatar_path" text,
	"is_custom" boolean DEFAULT false NOT NULL,
	"premium_only" boolean DEFAULT false NOT NULL,
	"created_at" timestamp,
	CONSTRAINT "personas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"event_type" text NOT NULL,
	"category" text NOT NULL,
	"detail" text NOT NULL,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"display_name" text,
	"pronouns" text,
	"gender" text,
	"turn_ons" text DEFAULT '[]' NOT NULL,
	"hard_limits" text DEFAULT '[]' NOT NULL,
	"soft_limits" text DEFAULT '[]' NOT NULL,
	"safe_word" text,
	"aftercare" text,
	"notes" text,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"tier" text DEFAULT 'free' NOT NULL,
	"age_verified" boolean DEFAULT false NOT NULL,
	"age_verified_at" timestamp,
	"verification_status" text DEFAULT 'pending' NOT NULL,
	"terminated" boolean DEFAULT false NOT NULL,
	"daily_message_count" integer DEFAULT 0 NOT NULL,
	"message_window_start" timestamp,
	"created_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personas" ADD CONSTRAINT "personas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;