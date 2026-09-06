# Recipe: Add Database

Add Postgres database support with Drizzle ORM (Supabase) for data persistence.

> **Note**: The older SQLite-over-HTTP approach (`@kilocode/app-builder-db`,
> `DB_URL`/`DB_TOKEN`) is **deprecated and removed**. Supabase Postgres is the
> production database. Do NOT reinstall `@kilocode/app-builder-db`.

## When to Use

- User needs to store data (users, posts, comments, etc.)
- Application requires authentication with user accounts
- Any feature requiring persistent state

## Prerequisites

- Base template already set up
- A Supabase project linked to the environment
- `DATABASE_URL` set in `.env.local` (and in Vercel project env for production)

## Environment

- `DATABASE_URL` — Supabase Postgres connection string (see `.env.example`).
  - Transaction pooler URI (port 6543) for serverless/Vercel.
  - Direct URI (port 5432, `db.<ref>.supabase.co`) for local migrations.
- The app (`src/db/index.ts`) throws at import time if `DATABASE_URL` is unset.

## Setup Steps

### Step 1: Install Dependencies

```bash
bun add drizzle-orm postgres && bun add -D drizzle-kit
```

### Step 2: Create All Required Files

⚠️ **Important**: Create ALL files before running generate. Setup fails if any are missing.

#### `src/db/schema.ts` - Table definitions

Use Postgres dialect (`drizzle-orm/pg-core`): `pgTable`, `serial` primary keys,
`text`, `integer` (with `{ mode: "boolean" }` / `{ mode: "timestamp" }` kept as
in the existing schema).

```typescript
import { pgTable, text, integer, serial } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Add more tables as needed
```

#### `src/db/index.ts` - Database client

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

if (!url) throw new Error("DATABASE_URL is not set.");

const client = postgres(url, { max: 1 });

export const db = drizzle(client, { schema });
```

#### `src/db/migrate.ts` - Migration script

```typescript
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./index";

await migrate(db, { migrationsFolder: "./src/db/migrations" });
```

#### `drizzle.config.ts` - Drizzle configuration (project root)

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
```

`drizzle-kit generate` does NOT connect to a live database; only the config
needs the URL to exist. `drizzle-kit` 0.31 loads a local `.env` automatically
when the `dotenv` package is present.

### Step 3: Add Package Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "bun run src/db/migrate.ts"
  }
}
```

### Step 4: Generate Migrations

```bash
bun db:generate
```

This does not need a live DB — safe to run any time. Review the generated
`src/db/migrations/0000_*.sql` before applying.

### Step 5: Apply Migrations

With `DATABASE_URL` set (direct connection recommended), migrations are applied by:

```bash
bun run db:migrate
```

or, alternatively, paste the generated SQL into the Supabase SQL Editor
(Dashboard → SQL Editor). Local/sandbox environments that cannot run a long-
lived migration runner should use the SQL Editor path. Production: make sure
`DATABASE_URL` is set in the Vercel project env.

### Step 6: Commit and Push

```bash
bun typecheck && bun lint && git add -A && git commit -m "Add database support" && git push
```

## Usage Examples

Database operations only work in Server Components and Server Actions.

```typescript
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Select all users
const allUsers = await db.select().from(users);

// Select by ID
const user = await db.select().from(users).where(eq(users.id, 1));

// Insert new user
await db.insert(users).values({ name: "John", email: "john@example.com" });

// Update user
await db.update(users).set({ name: "Jane" }).where(eq(users.id, 1));

// Delete user
await db.delete(users).where(eq(users.id, 1));
```

## Memory Bank Updates

After implementing, update `.kilocode/rules/memory-bank/context.md`:

- Add database to "Recently Completed" section
- Document the schema tables created
- Note any API routes or server actions added

Also update `.kilocode/rules/memory-bank/tech.md`:

- Add Drizzle ORM + postgres-js to dependencies
- Document database file structure
- `DATABASE_URL` in the environment variables table (drop `DB_URL`/`DB_TOKEN`)