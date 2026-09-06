-- Application code accesses these tables only through the server-side Postgres
-- connection. Enabling RLS without Data API policies denies anon/authenticated
-- access if the public schema is exposed by Supabase.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "personas" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "memories" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "security_events" ENABLE ROW LEVEL SECURITY;
