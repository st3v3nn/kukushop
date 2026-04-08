-- =====================================================
-- UPLOAD AND AUDIT TRACKING TABLES
-- =====================================================
-- Date: 2026-02-12
-- Purpose: Production-ready tracking for file uploads and system audits

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

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

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

-- =====================================================
-- UPDATE TRIGGERS FOR TIMESTAMPS
-- =====================================================

CREATE TRIGGER update_upload_logs_updated_at 
BEFORE UPDATE ON public.upload_logs 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

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

-- =====================================================
-- CLEANUP PROCEDURES
-- =====================================================

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

-- =====================================================
-- PERMISSIONS (FOR PRODUCTION)
-- =====================================================

-- Grant permissions to app user
GRANT SELECT, INSERT ON public.audit_logs TO speedy_app;
GRANT SELECT, INSERT ON public.upload_logs TO speedy_app;
GRANT SELECT, INSERT ON public.error_logs TO speedy_app;
GRANT SELECT ON public.recent_uploads_view TO speedy_app;
GRANT SELECT ON public.audit_trail_view TO speedy_app;
