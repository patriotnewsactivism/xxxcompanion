-- 0001: Surge embed bridge — companion users can be provisioned from a
-- Surge (hookup-radar) account via the /api/bridge flow.
ALTER TABLE users ADD COLUMN IF NOT EXISTS surge_sub TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_surge_sub_key ON users (surge_sub) WHERE surge_sub IS NOT NULL;
