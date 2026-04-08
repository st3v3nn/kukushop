-- Migration: create rider_orders table for storing rider-assigned orders
-- Date: 2026-02-13

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
