-- ============================================================================
-- SHALOM CONNECTHUB INDIA — Phase 7: Independent AI Automation Module
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. AI Settings & Spending Controls (Budget Target Guardrail)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE DEFAULT 'default',
  is_enabled boolean NOT NULL DEFAULT false,
  monthly_budget_cap_inr numeric(10, 2) NOT NULL DEFAULT 800.00 CHECK (monthly_budget_cap_inr >= 0),
  per_user_daily_limit integer NOT NULL DEFAULT 25 CHECK (per_user_daily_limit >= 0),
  enabled_features jsonb NOT NULL DEFAULT '{
    "listing_assistant": true,
    "translation": true,
    "candidate_matching": true,
    "property_matching": true,
    "moderation": true,
    "customer_assistant": true
  }'::jsonb,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER trg_ai_settings_updated_at
  BEFORE UPDATE ON public.ai_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.ai_settings (config_key, is_enabled, monthly_budget_cap_inr, per_user_daily_limit)
VALUES ('default', true, 800.00, 25)
ON CONFLICT (config_key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. AI Language Detection & Translations (Original Preserved Separately)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  original_language text NOT NULL CHECK (original_language IN ('en', 'hi', 'ml', 'unknown')),
  original_text text NOT NULL,
  translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (entity_type, entity_id)
);

CREATE TRIGGER trg_ai_translations_updated_at
  BEFORE UPDATE ON public.ai_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. AI Usage & Spend Logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  feature_key text NOT NULL CHECK (
    feature_key IN (
      'listing_assistant',
      'translation',
      'candidate_matching',
      'property_matching',
      'moderation',
      'customer_assistant'
    )
  ),
  model_name text NOT NULL DEFAULT 'gemini-2.5-flash',
  tokens_used integer NOT NULL DEFAULT 0 CHECK (tokens_used >= 0),
  estimated_cost_inr numeric(10, 4) NOT NULL DEFAULT 0 CHECK (estimated_cost_inr >= 0),
  status text NOT NULL CHECK (status IN ('SUCCESS', 'BLOCKED_CAP', 'BLOCKED_DISABLED', 'ERROR')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON public.ai_usage_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON public.ai_usage_logs (user_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 4. AI Moderation Flags (Requires Human Review)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_moderation_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  subject_text text NOT NULL DEFAULT '',
  severity text NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
  flag_reasons text[] NOT NULL DEFAULT '{}'::text[],
  ai_summary text NOT NULL,
  requires_human_review boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'REVIEWED', 'DISMISSED')),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_ai_mod_flags_status ON public.ai_moderation_flags (status, severity);

CREATE TRIGGER trg_ai_moderation_flags_updated_at
  BEFORE UPDATE ON public.ai_moderation_flags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Enable RLS on ALL 4 AI Tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_moderation_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_settings_read_all_write_admin"
  ON public.ai_settings FOR SELECT USING (true);

CREATE POLICY "ai_settings_admin_manage"
  ON public.ai_settings FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_system'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_system'));

CREATE POLICY "ai_translations_public_read"
  ON public.ai_translations FOR SELECT USING (true);

CREATE POLICY "ai_translations_auth_insert"
  ON public.ai_translations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "ai_usage_logs_own_or_admin"
  ON public.ai_usage_logs FOR SELECT
  USING (user_id = auth.uid() OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "ai_moderation_flags_admin_only"
  ON public.ai_moderation_flags FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_moderation'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_moderation'));
