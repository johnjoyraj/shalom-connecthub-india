-- ============================================================================
-- SHALOM CONNECTHUB INDIA — Phase 5: Financial, Subscriptions & Razorpay Engine
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Configurable Plans & Features (Never Hardcoded in Modules)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  monthly_price_inr numeric(10, 2) NOT NULL CHECK (monthly_price_inr >= 0),
  annual_price_inr numeric(10, 2) NOT NULL CHECK (annual_price_inr >= 0),
  listing_limit integer NOT NULL DEFAULT 1 CHECK (listing_limit >= 0),
  user_limit integer NOT NULL DEFAULT 1 CHECK (user_limit >= 1),
  enquiry_limit integer NOT NULL DEFAULT 50 CHECK (enquiry_limit >= 0),
  featured_credits integer NOT NULL DEFAULT 0 CHECK (featured_credits >= 0),
  auto_renew_allowed boolean NOT NULL DEFAULT false,
  is_highlight boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER trg_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.plan_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  feature_label text NOT NULL,
  is_included boolean NOT NULL DEFAULT true,
  UNIQUE (plan_id, feature_key)
);

-- Seed Default Configurable Plans (Section 12)
INSERT INTO public.plans (code, name, description, monthly_price_inr, annual_price_inr, listing_limit, user_limit, enquiry_limit, featured_credits, is_highlight, sort_order)
VALUES
  ('FREE', 'Free', 'Starter access with 1 active eligible listing', 0, 0, 1, 1, 25, 0, false, 10),
  ('STARTER', 'Starter', 'For individual employers, owners and tutors', 199, 1990, 3, 1, 100, 1, false, 20),
  ('PROFESSIONAL', 'Professional', 'For growing teams, agents and schools', 499, 4990, 10, 3, 500, 3, true, 30),
  ('BUSINESS', 'Business', 'Multi-branch Indian marketplace operations', 999, 9990, 30, 10, 2000, 10, false, 40),
  ('PREMIUM', 'Premium', 'High-volume enterprise marketplace suite', 1999, 19990, 100, 25, 10000, 25, false, 50)
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Subscriptions & Subscription Events
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organisation_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  billing_cycle text NOT NULL DEFAULT 'MONTHLY' CHECK (billing_cycle IN ('MONTHLY', 'ANNUAL', 'ONE_TIME')),
  status text NOT NULL DEFAULT 'PENDING_PAYMENT'
    CHECK (status IN ('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED')),
  starts_at timestamptz,
  expires_at timestamptz,
  auto_renew_authorized boolean NOT NULL DEFAULT false,
  last_reminder_stage text NOT NULL DEFAULT 'NONE'
    CHECK (last_reminder_stage IN ('NONE', '7D', '3D', '1D', '0D')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON public.subscriptions (expires_at) WHERE status = 'ACTIVE';

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_sub ON public.subscription_events (subscription_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 3. Promotional Coupons, Payments (No Card Details!), Invoices & Refunds
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promotional_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('PERCENT', 'FIXED')),
  discount_value numeric(10, 2) NOT NULL CHECK (discount_value > 0),
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

INSERT INTO public.promotional_coupons (code, discount_type, discount_value, max_uses, is_active)
VALUES ('LAUNCH20', 'PERCENT', 20, 500, true)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  organisation_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  purpose text NOT NULL CHECK (
    purpose IN ('SUBSCRIPTION', 'FEATURED_LISTING', 'LISTING_CREDIT', 'ENQUIRY_FEE', 'SERVICE_CHARGE')
  ),
  razorpay_order_id text UNIQUE,
  razorpay_payment_id text UNIQUE,
  razorpay_signature_verified boolean NOT NULL DEFAULT false,
  idempotency_key text NOT NULL UNIQUE,
  base_amount_inr numeric(12, 2) NOT NULL CHECK (base_amount_inr >= 0),
  discount_amount_inr numeric(12, 2) NOT NULL DEFAULT 0 CHECK (discount_amount_inr >= 0),
  tax_amount_inr numeric(12, 2) NOT NULL DEFAULT 0 CHECK (tax_amount_inr >= 0),
  total_amount_inr numeric(12, 2) NOT NULL CHECK (total_amount_inr >= 0),
  currency char(3) NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'CREATED'
    CHECK (status IN ('CREATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED')),
  failure_reason text,
  consent_confirmed boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments (status);

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  payment_id uuid NOT NULL UNIQUE REFERENCES public.payments(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  customer_name text NOT NULL,
  customer_gstin text,
  customer_state_code text NOT NULL DEFAULT 'UP',
  supplier_state_code text NOT NULL DEFAULT 'UP',
  tax_type text NOT NULL CHECK (tax_type IN ('INTRA_STATE', 'INTER_STATE')),
  taxable_amount_inr numeric(12, 2) NOT NULL,
  cgst_inr numeric(12, 2) NOT NULL DEFAULT 0,
  sgst_inr numeric(12, 2) NOT NULL DEFAULT 0,
  igst_inr numeric(12, 2) NOT NULL DEFAULT 0,
  total_amount_inr numeric(12, 2) NOT NULL,
  amount_in_words text NOT NULL,
  status text NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'VOID', 'REFUNDED')),
  issued_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_invoices_user ON public.invoices (user_id, issued_at DESC);

CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  razorpay_refund_id text UNIQUE,
  amount_inr numeric(12, 2) NOT NULL CHECK (amount_inr > 0),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'REQUESTED'
    CHECK (status IN ('REQUESTED', 'PROCESSED', 'FAILED', 'REJECTED')),
  processed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_refunds_payment ON public.refunds (payment_id);

CREATE TRIGGER trg_refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. Service Charges & Configurable Commission Rules (Consent-Gated)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text NOT NULL,
  service_type text NOT NULL,
  charge_type text NOT NULL CHECK (charge_type IN ('FIXED', 'PERCENTAGE', 'PER_LISTING', 'PER_LEAD')),
  amount_or_rate numeric(10, 2) NOT NULL CHECK (amount_or_rate >= 0),
  gst_percent numeric(5, 2) NOT NULL DEFAULT 18.00,
  effective_from date NOT NULL DEFAULT current_date,
  expires_at date,
  terms_and_conditions text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER trg_service_charges_updated_at
  BEFORE UPDATE ON public.service_charges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text NOT NULL,
  service_type text NOT NULL,
  charge_type text NOT NULL CHECK (charge_type IN ('FIXED', 'PERCENTAGE', 'PLACEMENT_FEE', 'FACILITATION_FEE')),
  rate_or_amount numeric(10, 2) NOT NULL CHECK (rate_or_amount >= 0),
  gst_percent numeric(5, 2) NOT NULL DEFAULT 18.00,
  effective_from date NOT NULL DEFAULT current_date,
  expires_at date,
  requires_contract_consent boolean NOT NULL DEFAULT true,
  terms_and_conditions text NOT NULL DEFAULT 'Applies only upon explicit written/digital contractual acceptance.',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER trg_commission_rules_updated_at
  BEFORE UPDATE ON public.commission_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.commission_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES public.commission_rules(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  gross_amount_inr numeric(12, 2) NOT NULL CHECK (gross_amount_inr >= 0),
  commission_amount_inr numeric(12, 2) NOT NULL CHECK (commission_amount_inr >= 0),
  tax_amount_inr numeric(12, 2) NOT NULL DEFAULT 0,
  contract_accepted boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'PENDING_CONSENT'
    CHECK (status IN ('PENDING_CONSENT', 'CONFIRMED', 'INVOICED', 'WAIVED')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

INSERT INTO public.service_charges (module_key, service_type, charge_type, amount_or_rate, gst_percent, terms_and_conditions, is_active)
VALUES
  ('property', 'FEATURED_PROPERTY_7D', 'FIXED', 299, 18.00, '7-day featured placement badge; non-refundable once active.', true),
  ('staff', 'FEATURED_JOB_14D', 'FIXED', 249, 18.00, '14-day priority placement in job search results.', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.commission_rules (module_key, service_type, charge_type, rate_or_amount, gst_percent, requires_contract_consent, terms_and_conditions, is_active)
VALUES
  ('staff', 'SUCCESSFUL_PLACEMENT_ASSIST', 'PLACEMENT_FEE', 2.00, 18.00, true, 'Optional recruitment placement facilitation fee; never auto-deducted without signed employer terms.', true),
  ('property', 'FACILITATION_AGREEMENT', 'FACILITATION_FEE', 1.00, 18.00, true, 'Optional negotiated facilitation fee; strictly requires signed bilateral agreement.', true)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. Enable RLS on ALL 11 Financial Tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotional_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_records ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 6. Strict Financial RLS Policies (Backend-Verified Payments Only!)
-- ----------------------------------------------------------------------------
CREATE POLICY "plans_public_read"
  ON public.plans FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "plans_admin_finance_manage"
  ON public.plans FOR ALL
  USING (public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "plan_features_public_read"
  ON public.plan_features FOR SELECT USING (true);

CREATE POLICY "plan_features_admin_finance_manage"
  ON public.plan_features FOR ALL
  USING (public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "service_charges_public_read"
  ON public.service_charges FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "service_charges_admin_finance_manage"
  ON public.service_charges FOR ALL
  USING (public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "commission_rules_public_read"
  ON public.commission_rules FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "commission_rules_admin_finance_manage"
  ON public.commission_rules FOR ALL
  USING (public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'));

-- Users can ONLY read their own subscriptions, payments, invoices, refunds, commission records;
-- Writers MUST be service_role (Edge Functions) or admin_finance/super_admin (except refund request creation).
CREATE POLICY "subscriptions_select_own_or_finance"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "subscriptions_admin_finance_manage"
  ON public.subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "subscription_events_select_own_or_finance"
  ON public.subscription_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.id = subscription_id AND s.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin_finance')
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "payments_select_own_or_finance"
  ON public.payments FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "invoices_select_own_or_finance"
  ON public.invoices FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "refunds_select_own_or_finance"
  ON public.refunds FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "refunds_insert_own_request"
  ON public.refunds FOR INSERT
  WITH CHECK (user_id = auth.uid() AND status = 'REQUESTED');

CREATE POLICY "refunds_admin_finance_update"
  ON public.refunds FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "coupons_read_active_or_finance"
  ON public.promotional_coupons FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "coupons_admin_finance_manage"
  ON public.promotional_coupons FOR ALL
  USING (public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "commission_records_select_own_or_finance"
  ON public.commission_records FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'));
