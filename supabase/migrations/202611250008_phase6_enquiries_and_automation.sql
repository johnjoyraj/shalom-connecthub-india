-- ============================================================================
-- SHALOM CONNECTHUB INDIA — Phase 6: Common Enquiry Engine & Automation
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Common Enquiries, Conversations & Messages
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  subject text NOT NULL DEFAULT '',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'NEW' CHECK (
    status IN ('NEW', 'VIEWED', 'CONTACTED', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED', 'CLOSED')
  ),
  feedback_rating smallint CHECK (feedback_rating IS NULL OR feedback_rating BETWEEN 1 AND 5),
  feedback_comment text,
  last_owner_response_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_enquiries_customer ON public.enquiries (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_owner ON public.enquiries (owner_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_listing ON public.enquiries (listing_id);

CREATE TRIGGER trg_enquiries_updated_at
  BEFORE UPDATE ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id uuid UNIQUE REFERENCES public.enquiries(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_conversations_parties ON public.conversations (customer_id, owner_id);

CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages (conversation_id, created_at ASC);

-- ----------------------------------------------------------------------------
-- 2. Notifications, Templates, Delivery Logs, Automation Queue & Webhooks
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('IN_APP', 'WHATSAPP', 'EMAIL', 'PUSH')),
  event_type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  dedup_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  channel text NOT NULL CHECK (channel IN ('IN_APP', 'WHATSAPP', 'EMAIL', 'PUSH')),
  subject text NOT NULL DEFAULT '',
  body_template text NOT NULL,
  whatsapp_template_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER trg_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.notification_templates (template_key, channel, subject, body_template, whatsapp_template_name, is_active)
VALUES
  ('welcome_user', 'EMAIL', 'Welcome to SHALOM CONNECTHUB INDIA', 'Hello {{name}}, welcome to Shalom ConnectHub India.', 'welcome_connecthub', true),
  ('new_enquiry_owner', 'WHATSAPP', 'New Marketplace Enquiry', 'You have a new enquiry on {{listing_title}} from {{customer_name}}.', 'new_enquiry_alert', true),
  ('payment_receipt', 'EMAIL', 'Payment Receipt & GST Invoice', 'Thank you {{name}}. Invoice {{invoice_number}} for INR {{amount}} is issued.', 'payment_confirmation', true),
  ('subscription_expiry_reminder', 'WHATSAPP', 'Subscription Expiry Reminder', 'Your {{plan_name}} plan expires in {{days_left}} day(s).', 'subscription_reminder', true),
  ('unanswered_enquiry_reminder', 'PUSH', 'Unanswered Enquiry Reminder', 'You have an unanswered enquiry on {{listing_title}}.', NULL, true)
ON CONFLICT (template_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES public.notifications(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('IN_APP', 'WHATSAPP', 'EMAIL', 'PUSH')),
  recipient text NOT NULL,
  provider text NOT NULL,
  status text NOT NULL CHECK (status IN ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'SKIPPED_NO_CONSENT', 'SKIPPED_RATE_LIMIT')),
  provider_message_id text,
  error_message text,
  cost_estimate_inr numeric(8, 4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON public.notification_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_logs (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.automation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  dedup_key text NOT NULL UNIQUE,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRYING')),
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  next_run_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_automation_jobs_pending ON public.automation_jobs (status, next_run_at) WHERE status IN ('PENDING', 'RETRYING');

CREATE TRIGGER trg_automation_jobs_updated_at
  BEFORE UPDATE ON public.automation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('RAZORPAY', 'WHATSAPP', 'EMAIL')),
  event_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED')),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (provider, event_id)
);

-- ----------------------------------------------------------------------------
-- 3. Enable RLS on ALL 8 Phase 6 Tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 4. RLS Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "enquiries_select_parties"
  ON public.enquiries FOR SELECT
  USING (
    customer_id = auth.uid()
    OR owner_id = auth.uid()
    OR public.has_any_admin_role(auth.uid())
  );

CREATE POLICY "enquiries_insert_customer"
  ON public.enquiries FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "enquiries_update_parties"
  ON public.enquiries FOR UPDATE
  USING (
    customer_id = auth.uid()
    OR owner_id = auth.uid()
    OR public.has_any_admin_role(auth.uid())
  );

CREATE POLICY "conversations_select_parties"
  ON public.conversations FOR SELECT
  USING (
    customer_id = auth.uid()
    OR owner_id = auth.uid()
    OR public.has_any_admin_role(auth.uid())
  );

CREATE POLICY "conversations_insert_parties"
  ON public.conversations FOR INSERT
  WITH CHECK (customer_id = auth.uid() OR owner_id = auth.uid());

CREATE POLICY "messages_select_parties"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.customer_id = auth.uid() OR c.owner_id = auth.uid() OR public.has_any_admin_role(auth.uid()))
    )
  );

CREATE POLICY "messages_insert_participant"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.customer_id = auth.uid() OR c.owner_id = auth.uid())
    )
  );

CREATE POLICY "notifications_own_or_admin"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid() OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "notifications_mark_read_own"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "notification_templates_admin_manage"
  ON public.notification_templates FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_system'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_system'));

CREATE POLICY "notification_logs_select_own_or_admin"
  ON public.notification_logs FOR SELECT
  USING (user_id = auth.uid() OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "automation_jobs_admin_only"
  ON public.automation_jobs FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_system'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_system'));

CREATE POLICY "webhook_events_admin_only"
  ON public.webhook_events FOR SELECT
  USING (public.has_any_admin_role(auth.uid()));
