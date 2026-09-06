import { migrate } from "drizzle-orm/postgres-js/migrator";
import { closeDatabase, db } from "./index";

try {
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
} finally {
  await closeDatabase();
}
