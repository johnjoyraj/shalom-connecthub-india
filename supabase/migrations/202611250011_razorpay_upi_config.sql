-- ============================================================================
-- SHALOM CONNECTHUB INDIA — Phase 10+: Razorpay & UPI (7379325499@ybl) Config
-- ============================================================================

INSERT INTO public.platform_settings (key, value, category, description, is_public)
VALUES (
  'payment_gateway_config',
  '{
    "upi_vpa": "7379325499@ybl",
    "payee_name": "SHALOM CONNECTHUB INDIA",
    "razorpay_enabled": true,
    "upi_qr_enabled": true,
    "mode": "SANDBOX"
  }'::jsonb,
  'FINANCE',
  'Public payment gateway and UPI VPA configuration (zero secret keys stored here)',
  true
)
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      is_public = true;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'RAZORPAY_CHECKOUT'
    CHECK (payment_method IN ('RAZORPAY_CHECKOUT', 'UPI_INTENT_QR'));

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS upi_vpa text;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS upi_utr_reference text;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS upi_verification_status text NOT NULL DEFAULT 'NONE'
    CHECK (upi_verification_status IN ('NONE', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_upi_utr_unique
  ON public.payments (upi_utr_reference)
  WHERE upi_utr_reference IS NOT NULL;
