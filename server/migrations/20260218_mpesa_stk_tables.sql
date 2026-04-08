-- Migration: create mpesa_stk_requests and mpesa_stk_callbacks, add orders.payment_status

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
