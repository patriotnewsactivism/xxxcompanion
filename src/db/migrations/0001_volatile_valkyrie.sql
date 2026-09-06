CREATE TABLE `user_profiles` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`display_name` text,
	`pronouns` text,
	`gender` text,
	`turn_ons` text DEFAULT '[]' NOT NULL,
	`hard_limits` text DEFAULT '[]' NOT NULL,
	`soft_limits` text DEFAULT '[]' NOT NULL,
	`safe_word` text,
	`aftercare` text,
	`notes` text,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `personas` ADD `appearance` text;--> statement-breakpoint
ALTER TABLE `personas` ADD `pronouns` text;--> statement-breakpoint
ALTER TABLE `personas` ADD `kinks` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `personas` ADD `hard_limits` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `personas` ADD `soft_limits` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `personas` ADD `scene` text;--> statement-breakpoint
ALTER TABLE `personas` ADD `explicitness` integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE `personas` ADD `narrative_style` text DEFAULT 'second' NOT NULL;--> statement-breakpoint
ALTER TABLE `personas` ADD `response_length` text DEFAULT 'balanced' NOT NULL;--> statement-breakpoint
ALTER TABLE `personas` ADD `greeting` text;