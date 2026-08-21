CREATE TABLE `conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`mode` text DEFAULT 'single' NOT NULL,
	`title` text DEFAULT 'New conversation' NOT NULL,
	`persona_ids` text DEFAULT '[]' NOT NULL,
	`short_term` text DEFAULT '[]' NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `memories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`kind` text NOT NULL,
	`key` text NOT NULL,
	`content` text NOT NULL,
	`embedding` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversation_id` integer NOT NULL,
	`speaker_token` text DEFAULT 'companion' NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`moderation_status` text DEFAULT 'allowed' NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `personas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`tagline` text NOT NULL,
	`genre` text NOT NULL,
	`relationship_dynamic` text NOT NULL,
	`tone` text NOT NULL,
	`definition` text NOT NULL,
	`voice_config` text,
	`avatar_path` text,
	`is_custom` integer DEFAULT false NOT NULL,
	`premium_only` integer DEFAULT false NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `personas_slug_unique` ON `personas` (`slug`);--> statement-breakpoint
CREATE TABLE `security_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`event_type` text NOT NULL,
	`category` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tier` text DEFAULT 'free' NOT NULL,
	`age_verified` integer DEFAULT false NOT NULL,
	`age_verified_at` integer,
	`verification_status` text DEFAULT 'pending' NOT NULL,
	`terminated` integer DEFAULT false NOT NULL,
	`daily_message_count` integer DEFAULT 0 NOT NULL,
	`message_window_start` integer,
	`created_at` integer
);
