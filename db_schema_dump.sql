-- Combined schema dump for Speedy Bites
-- Generated: 2026-02-22
-- Notes:
--  - Some migrations reference existing objects (e.g., public.users, update_updated_at_column())
--    which may be defined in earlier migrations not present here. Review and adjust before applying.
--  - Replace placeholder passwords in create_db.sql before running.

-- ========================
-- infra/create_db.sql
-- ========================
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
-- 3) Run the SQL migrations found in `server/migrations/` to create tables.


-- ========================
-- server/migrations/20260212_production_audit_tables.sql
-- ========================
-- UPLOAD AND AUDIT TRACKING TABLES

-- Create audit_logs table for tracking all system changes
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  actor_type TEXT NOT NULL DEFAULT 'user', -- 'user', 'system', 'admin'
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resource_type TEXT NOT NULL, -- 'product', 'category', 'user', etc
  resource_id UUID,
  resource_name TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  http_method TEXT,
  http_path TEXT,
  status_code INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

-- Create upload_logs table for tracking file uploads
CREATE TABLE IF NOT EXISTS public.upload_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  uploaded_by_role TEXT NOT NULL DEFAULT 'admin', -- 'admin', 'user'
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_mime_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  upload_type TEXT NOT NULL, -- 'product', 'category', 'avatar', etc
  related_resource_type TEXT,
  related_resource_id UUID,
  upload_status TEXT NOT NULL DEFAULT 'success', -- 'success', 'failed', 'quarantined'
  error_message TEXT,
  ip_address INET,
  checksum VARCHAR(64), -- SHA256 hash of file for deduplication
  is_optimized BOOLEAN DEFAULT false,
  optimization_formats TEXT[], -- {'webp', 'jpeg'}
  storage_location TEXT DEFAULT 'local', -- 'local', 's3', 'gcs'
  storage_metadata JSONB DEFAULT '{}', -- Store URLs, bucket info, etc
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT upload_logs_pkey PRIMARY KEY (id),
  CONSTRAINT upload_logs_checksum_unique UNIQUE (checksum) -- Prevent duplicate uploads
);

-- Create error_logs table for tracking application errors
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_code TEXT,
  error_stack TEXT,
  endpoint TEXT,
  method TEXT,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ip_address INET,
  request_body JSONB,
  response_body JSONB,
  severity TEXT NOT NULL DEFAULT 'error', -- 'info', 'warning', 'error', 'critical'
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT error_logs_pkey PRIMARY KEY (id)
);

-- INDEXES FOR PERFORMANCE

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- Upload logs indexes
CREATE INDEX IF NOT EXISTS idx_upload_logs_created_at ON public.upload_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_upload_logs_user_id ON public.upload_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_logs_resource ON public.upload_logs(related_resource_type, related_resource_id);
CREATE INDEX IF NOT EXISTS idx_upload_logs_checksum ON public.upload_logs(checksum);
CREATE INDEX IF NOT EXISTS idx_upload_logs_status ON public.upload_logs(upload_status);

-- Error logs indexes
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_endpoint ON public.error_logs(endpoint);

-- UPDATE TRIGGERS FOR TIMESTAMPS

CREATE TRIGGER update_upload_logs_updated_at 
BEFORE UPDATE ON public.upload_logs 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- VIEWS FOR ANALYTICS

-- View for recent uploads
CREATE OR REPLACE VIEW public.recent_uploads_view AS
SELECT 
  ul.id,
  ul.original_filename,
  ul.file_size,
  ul.upload_type,
  u.email as uploaded_by_email,
  ul.created_at,
  ul.upload_status
FROM public.upload_logs ul
LEFT JOIN public.users u ON ul.user_id = u.id
ORDER BY ul.created_at DESC
LIMIT 100;

-- View for audit trail
CREATE OR REPLACE VIEW public.audit_trail_view AS
SELECT 
  al.id,
  al.action,
  al.actor_type,
  u.email as actor_email,
  al.resource_type,
  al.resource_name,
  al.http_method,
  al.http_path,
  al.status_code,
  al.created_at
FROM public.audit_logs al
LEFT JOIN public.users u ON al.actor_id = u.id
ORDER BY al.created_at DESC
LIMIT 1000;

-- CLEANUP PROCEDURES

-- Function to clean up old logs (call periodically)
CREATE OR REPLACE FUNCTION cleanup_old_logs(retention_days INT DEFAULT 90)
RETURNS TABLE(deleted_audit INT, deleted_uploads INT, deleted_errors INT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_audit INT;
  v_deleted_uploads INT;
  v_deleted_errors INT;
BEGIN
  -- Delete old audit logs
  DELETE FROM public.audit_logs 
  WHERE created_at < NOW() - INTERVAL '1 day' * retention_days;
  GET DIAGNOSTICS v_deleted_audit = ROW_COUNT;

  -- Delete old upload logs
  DELETE FROM public.upload_logs 
  WHERE created_at < NOW() - INTERVAL '1 day' * retention_days
  AND upload_status = 'failed';
  GET DIAGNOSTICS v_deleted_uploads = ROW_COUNT;

  -- Delete old error logs
  DELETE FROM public.error_logs 
  WHERE created_at < NOW() - INTERVAL '1 day' * retention_days
  AND resolved = true;
  GET DIAGNOSTICS v_deleted_errors = ROW_COUNT;

  RETURN QUERY SELECT v_deleted_audit, v_deleted_uploads, v_deleted_errors;
END;
$$;

-- PERMISSIONS (FOR PRODUCTION)

-- Grant permissions to app user
GRANT SELECT, INSERT ON public.audit_logs TO speedy_app;
GRANT SELECT, INSERT ON public.upload_logs TO speedy_app;
GRANT SELECT, INSERT ON public.error_logs TO speedy_app;
GRANT SELECT ON public.recent_uploads_view TO speedy_app;
GRANT SELECT ON public.audit_trail_view TO speedy_app;


-- ========================
-- server/migrations/20260213_rider_orders.sql
-- ========================
CREATE TABLE IF NOT EXISTS public.rider_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL,
  status TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  total NUMERIC DEFAULT 0,
  address JSONB DEFAULT '{}'::jsonb,
  distance TEXT,
  estimated_time TEXT,
  assigned_rider_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rider_orders_status ON public.rider_orders(status);
CREATE INDEX IF NOT EXISTS idx_rider_orders_assigned ON public.rider_orders(assigned_rider_id);


-- ========================
-- server/migrations/20260218_mpesa_stk_tables.sql
-- ========================
CREATE TABLE IF NOT EXISTS public.mpesa_stk_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  merchant_request_id TEXT,
  checkout_request_id TEXT,
  response_code TEXT,
  response_description TEXT,
  amount NUMERIC,
  phone TEXT,
  account_reference TEXT,
  transaction_desc TEXT,
  status TEXT DEFAULT 'initiated',
  provider_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mpesa_stk_requests_checkout ON public.mpesa_stk_requests(checkout_request_id);

CREATE TABLE IF NOT EXISTS public.mpesa_stk_callbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stk_request_id UUID REFERENCES public.mpesa_stk_requests(id) ON DELETE SET NULL,
  merchant_request_id TEXT,
  checkout_request_id TEXT,
  result_code INTEGER,
  result_desc TEXT,
  mpesa_receipt_number TEXT,
  amount NUMERIC,
  phone TEXT,
  transaction_date TEXT,
  body JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add payment_status column to orders if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
  END IF;
END
$$;


-- ========================
-- server/migrations/20260222_add_app_settings.sql
-- ========================
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default free_delivery flag if not present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_settings WHERE key = 'free_delivery') THEN
    INSERT INTO public.app_settings(key, value) VALUES ('free_delivery', jsonb_build_object('enabled', false));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(key);


-- ========================
-- server/migrations/20260222_add_notifications_and_rider_assignments.sql
-- ========================
-- 1) Ensure notifications.data JSONB column exists (safe to run multiple times)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'data'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN data JSONB DEFAULT '{}'::jsonb;
  END IF;
END
$$;

-- 2) Create rider_assignments table to record which rider was assigned to which order
CREATE TABLE IF NOT EXISTS public.rider_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  delivery_fee NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rider_assignments_rider_id ON public.rider_assignments(rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_assignments_order_id ON public.rider_assignments(order_id);


-- End of combined schema dump

-- IMPORTANT:
-- - Review for dependencies on tables/functions not included (e.g., public.users, update_updated_at_column())
-- - Replace any placeholder passwords and validate before applying to a live server.
