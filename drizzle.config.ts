import { defineConfig } from "drizzle-kit";

// Drizzle-kit reads process.env at run time. DATABASE_URL must be set for
// `bun run db:generate` (dialect/config only — generate does not connect to
// a live database) and for `bun run db:migrate` (connects and applies).
// drizzle-kit 0.31 loads a local .env automatically when the dotenv package
// is present, otherwise export DATABASE_URL in the shell.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});