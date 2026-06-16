-- Least-privilege READ-ONLY Neon role for the Postgres MCP server (DBHub).
-- See docs/mcp-servers.md. Run ONCE in the Neon SQL Editor (or psql) as your
-- Neon OWNER role (the default project role; it has neon_superuser).
--
-- Replace <STRONG_PASSWORD> with a strong secret (Neon requires >=12 chars,
-- mixed character types, >=60 bits of entropy). Do NOT commit the real password
-- — this file ships with a placeholder only.
--
-- Scope below: database `neondb`, schema `public`. Repeat the schema-level grants
-- for any other non-public schema you want readable.

-- 1) Dedicated login role, read-only by design (no CREATEDB/CREATEROLE/SUPERUSER).
CREATE ROLE meridian_ro WITH LOGIN PASSWORD '<STRONG_PASSWORD>';

-- 2) Connect + schema usage.
GRANT CONNECT ON DATABASE neondb TO meridian_ro;
GRANT USAGE   ON SCHEMA   public TO meridian_ro;

-- 3) Read existing objects.
GRANT SELECT ON ALL TABLES    IN SCHEMA public TO meridian_ro;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO meridian_ro;  -- optional; reads sequence values

-- 4) Read FUTURE objects automatically. ALTER DEFAULT PRIVILEGES only affects
--    objects created by the role that RUNS this statement, so run it AS the role
--    that owns/creates your tables (your Neon owner role / the migration role).
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES    TO meridian_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO meridian_ro;

-- 5) Lock the door: never grant INSERT/UPDATE/DELETE/CREATE. Also remove CREATE
--    on public so the role cannot create objects.
REVOKE CREATE ON SCHEMA public FROM meridian_ro;

-- If migrations run as a DIFFERENT role than the one above, re-run step 4 while
-- connected as THAT role, or run this after each migration:
--   GRANT SELECT ON ALL TABLES IN SCHEMA public TO meridian_ro;

-- Verify (as the owner):
--   SET ROLE meridian_ro;
--   SELECT 1;                                    -- must succeed
--   CREATE TABLE _probe(x int);                  -- must fail: permission denied
--   RESET ROLE;
