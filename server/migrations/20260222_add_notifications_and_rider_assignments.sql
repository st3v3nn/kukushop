-- Migration: add notifications.data column if missing and create rider_assignments table
-- Date: 2026-02-22

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
