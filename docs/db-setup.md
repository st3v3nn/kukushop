# Postgres Database Setup for Kuku ni Sisi (VPS / Production)

This document explains how to set up a secure PostgreSQL database on an Ubuntu VPS and connect the frontend (containerized) app to it. The app expects a Supabase-style Postgres schema; use the SQL migrations in `supabase/migrations/` to create tables.

1) Secure Postgres installation (Ubuntu)

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

2) Create the database and user (run as `postgres` user)

Edit `infra/create_db.sql` to change the `REPLACE_WITH_STRONG_PASSWORD` placeholder, then:

```bash
sudo -u postgres psql -f infra/create_db.sql
```

Alternatively, create user and DB interactively:

```bash
sudo -u postgres psql
CREATE DATABASE speedy_bites;
CREATE USER speedy_app WITH ENCRYPTED PASSWORD 'a-very-strong-password';
GRANT CONNECT ON DATABASE speedy_bites TO speedy_app;
\c speedy_bites
CREATE SCHEMA IF NOT EXISTS app_schema AUTHORIZATION speedy_app;
\q
```

3) Apply migrations (from project root)

On the VPS, assuming `psql` can reach the database (local socket):

```bash
for f in supabase/migrations/*.sql; do
  sudo -u postgres psql -d speedy_bites -f "$f"
done
```

If the DB is remote, use:

```bash
psql "postgresql://postgres@localhost:5432/speedy_bites" -f supabase/migrations/20260125190518_68059c38-df81-476e-bf53-517262934b0e.sql
```

4) Enable SSL and firewall (optional but recommended)

- Generate or install TLS certs and configure Postgres to use them (`ssl = on` in `postgresql.conf`).
- Restrict `pg_hba.conf` to require `scram-sha-256` for password auth and to only allow trusted IPs.
- Use `ufw` to limit access to port 5432 to only the app server IP(s):

```bash
sudo ufw allow from <APP_SERVER_IP> to any port 5432
sudo ufw enable
```

5) Connection from the containerized app

Provide these environment variables to the production container (via your host env, Docker secrets, or platform secret manager):

- `VITE_SUPABASE_URL` — public URL or PostgREST endpoint
- `VITE_SUPABASE_PUBLISHABLE_KEY` — client-side publishable key (if using Supabase)
  - NOTE: never put service-role or admin keys into client-side envs.

For a server-side backend (Laravel), configure `DATABASE_URL` or the Laravel DB config to use `postgresql://speedy_app:<password>@<db-host>:5432/speedy_bites`.

6) Migrations & schema

This repo includes `supabase/migrations/`. After creating the DB, run those SQL files in order to create tables and seed data.

7) Hardening checklist

- Use strong, unique passwords; prefer `scram-sha-256` authentication.
- Restrict access with firewall to only allowed app servers.
- Use TLS between app and DB. Configure Postgres with valid certs.
- Use a dedicated DB role with least privileges for the application.
- Store DB credentials in a secret manager / Docker secrets and do not commit them.

If you want, I can:

- Generate a `docker-compose.prod.yml` that uses Docker secrets and an nginx reverse proxy.
- Add CI steps to build the Docker image and push it to a registry.
- Create an example `systemd` unit to run the container on the VPS.
