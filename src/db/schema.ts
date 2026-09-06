import {
  pgTable,
  text,
  integer,
  serial,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  tier: text("tier").notNull().default("free"),
  ageVerified: boolean("age_verified").notNull().default(false),
  ageVerifiedAt: timestamp("age_verified_at"),
  verificationStatus: text("verification_status").notNull().default("pending"),
  terminated: boolean("terminated").notNull().default(false),
  dailyMessageCount: integer("daily_message_count").notNull().default(0),
  messageWindowStart: timestamp("message_window_start"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
});

export const personas = pgTable("personas", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  genre: text("genre").notNull(),
  relationshipDynamic: text("relationship_dynamic").notNull(),
  tone: text("tone").notNull(),
  definition: text("definition").notNull(),
  appearance: text("appearance"),
  pronouns: text("pronouns"),
  kinks: text("kinks").notNull().default("[]"),
  hardLimits: text("hard_limits").notNull().default("[]"),
  softLimits: text("soft_limits").notNull().default("[]"),
  scene: text("scene"),
  explicitness: integer("explicitness").notNull().default(3),
  narrativeStyle: text("narrative_style").notNull().default("second"),
  responseLength: text("response_length").notNull().default("balanced"),
  greeting: text("greeting"),
  voiceConfig: text("voice_config"),
  avatarPath: text("avatar_path"),
  isCustom: boolean("is_custom").notNull().default(false),
  premiumOnly: boolean("premium_only").notNull().default(false),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
});

export const userProfiles = pgTable("user_profiles", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id),
  displayName: text("display_name"),
  pronouns: text("pronouns"),
  gender: text("gender"),
  turnOns: text("turn_ons").notNull().default("[]"),
  hardLimits: text("hard_limits").notNull().default("[]"),
  softLimits: text("soft_limits").notNull().default("[]"),
  safeWord: text("safe_word"),
  aftercare: text("aftercare"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  mode: text("mode").notNull().default("single"),
  title: text("title").notNull().default("New conversation"),
  personaIds: text("persona_ids").notNull().default("[]"),
  shortTerm: text("short_term").notNull().default("[]"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id),
  speakerToken: text("speaker_token").notNull().default("companion"),
  role: text("role").notNull(),
  content: text("content").notNull(),
  moderationStatus: text("moderation_status").notNull().default("allowed"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
});

export const memories = pgTable("memories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  kind: text("kind").notNull(),
  key: text("key").notNull(),
  content: text("content").notNull(),
  embedding: text("embedding"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
});

export const securityEvents = pgTable("security_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  eventType: text("event_type").notNull(),
  category: text("category").notNull(),
  detail: text("detail").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
});