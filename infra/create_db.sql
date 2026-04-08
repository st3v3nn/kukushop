-- Create a dedicated role and database for Speedy Bites
-- Replace placeholders before running: <DB_ADMIN_USER>, <DB_ADMIN_PASSWORD>, <APP_DB>, <APP_USER>, <APP_PASSWORD>

-- Create a superuser or admin role (run as postgres/system admin)
-- Example: sudo -u postgres psql -f create_db.sql

-- Create the application database
CREATE DATABASE speedy_bites;

\connect speedy_bites;

-- Enable required extensions (uuid, pgcrypto for UUID generation)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create an application role with limited privileges
CREATE ROLE speedy_app WITH LOGIN PASSWORD 'REPLACE_WITH_STRONG_PASSWORD';

-- Create a schema owned by the app role to limit access
CREATE SCHEMA IF NOT EXISTS app_schema AUTHORIZATION speedy_app;

-- Grant usage on public objects as necessary (migrations may create tables)
GRANT CONNECT ON DATABASE speedy_bites TO speedy_app;
GRANT USAGE ON SCHEMA app_schema TO speedy_app;

-- Revoke default public privileges to tighten security
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE USAGE ON SCHEMA public FROM PUBLIC;

-- Notes:
-- 1) Replace passwords before running this script.
-- 2) Use `psql -h <host> -U postgres -f create_db.sql` on the VPS.
-- 3) Run the SQL migrations found in `supabase/migrations/` to create tables.
