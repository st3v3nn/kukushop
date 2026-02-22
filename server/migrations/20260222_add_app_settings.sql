-- Migration: create app_settings table and insert default free_delivery flag
-- Date: 2026-02-22

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
