import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tier: text("tier").notNull().default("free"),
  ageVerified: integer("age_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  ageVerifiedAt: integer("age_verified_at", { mode: "timestamp" }),
  verificationStatus: text("verification_status").notNull().default("pending"),
  terminated: integer("terminated", { mode: "boolean" }).notNull().default(false),
  dailyMessageCount: integer("daily_message_count").notNull().default(0),
  messageWindowStart: integer("message_window_start", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const personas = sqliteTable("personas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
  isCustom: integer("is_custom", { mode: "boolean" }).notNull().default(false),
  premiumOnly: integer("premium_only", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const userProfiles = sqliteTable("user_profiles", {
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
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const conversations = sqliteTable("conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  mode: text("mode").notNull().default("single"),
  title: text("title").notNull().default("New conversation"),
  personaIds: text("persona_ids").notNull().default("[]"),
  shortTerm: text("short_term").notNull().default("[]"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id),
  speakerToken: text("speaker_token").notNull().default("companion"),
  role: text("role").notNull(),
  content: text("content").notNull(),
  moderationStatus: text("moderation_status").notNull().default("allowed"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const memories = sqliteTable("memories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  kind: text("kind").notNull(),
  key: text("key").notNull(),
  content: text("content").notNull(),
  embedding: text("embedding"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const securityEvents = sqliteTable("security_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  eventType: text("event_type").notNull(),
  category: text("category").notNull(),
  detail: text("detail").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});