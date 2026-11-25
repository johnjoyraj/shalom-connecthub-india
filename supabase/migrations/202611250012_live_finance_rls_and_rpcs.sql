-- ============================================================================
-- SHALOM CONNECTHUB INDIA — Phase 10+: Live Financial & UPI RLS Policies
-- Enables secure user UPI order creation/UTR submission & Finance Admin verification
-- without ever allowing clients to self-mark payments SUCCEEDED or tamper amounts.
-- ============================================================================

-- 1. Allow Finance Admin to manage payment_gateway_config in platform_settings
DROP POLICY IF EXISTS "platform_settings_admin_finance_gateway" ON public.platform_settings;
CREATE POLICY "platform_settings_admin_finance_gateway"
  ON public.platform_settings FOR ALL
  USING (
    key = 'payment_gateway_config'
    AND (public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'))
  )
  WITH CHECK (
    key = 'payment_gateway_config'
    AND (public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'))
  );

-- 2. Protect immutable payment amounts/fields when non-admin users submit UTR
CREATE OR REPLACE FUNCTION public.enforce_payment_user_update_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role'
     OR public.has_role(auth.uid(), 'admin_finance')
     OR public.has_role(auth.uid(), 'super_admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.base_amount_inr IS DISTINCT FROM OLD.base_amount_inr
     OR NEW.discount_amount_inr IS DISTINCT FROM OLD.discount_amount_inr
     OR NEW.tax_amount_inr IS DISTINCT FROM OLD.tax_amount_inr
     OR NEW.total_amount_inr IS DISTINCT FROM OLD.total_amount_inr
     OR NEW.razorpay_order_id IS DISTINCT FROM OLD.razorpay_order_id
     OR NEW.razorpay_signature_verified IS DISTINCT FROM false
     OR NEW.status = 'SUCCEEDED'
     OR NEW.upi_verification_status = 'VERIFIED' THEN
    RAISE EXCEPTION 'Unauthorized payment field modification';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payments_protect_user_fields ON public.payments;
CREATE TRIGGER trg_payments_protect_user_fields
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_payment_user_update_guard();

-- 3. Authenticated users can initiate CREATED orders and submit UTR (status -> PENDING)
DROP POLICY IF EXISTS "payments_insert_own_created" ON public.payments;
CREATE POLICY "payments_insert_own_created"
  ON public.payments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'CREATED'
    AND razorpay_signature_verified = false
    AND upi_verification_status = 'NONE'
    AND consent_confirmed = true
  );

DROP POLICY IF EXISTS "payments_update_own_upi_utr" ON public.payments;
CREATE POLICY "payments_update_own_upi_utr"
  ON public.payments FOR UPDATE
  USING (
    user_id = auth.uid()
    AND status IN ('CREATED', 'PENDING')
  )
  WITH CHECK (
    user_id = auth.uid()
    AND payment_method = 'UPI_INTENT_QR'
    AND status = 'PENDING'
    AND upi_verification_status = 'PENDING_VERIFICATION'
    AND razorpay_signature_verified = false
  );

-- 4. Finance Admin & Super Admin full management on payments, invoices, subscription_events
DROP POLICY IF EXISTS "payments_admin_finance_manage" ON public.payments;
CREATE POLICY "payments_admin_finance_manage"
  ON public.payments FOR ALL
  USING (public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "invoices_admin_finance_manage" ON public.invoices;
CREATE POLICY "invoices_admin_finance_manage"
  ON public.invoices FOR ALL
  USING (public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "subscription_events_admin_finance_insert" ON public.subscription_events;
CREATE POLICY "subscription_events_admin_finance_insert"
  ON public.subscription_events FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin_finance') OR public.has_role(auth.uid(), 'super_admin'));

-- 5. Allow enquiry counterparties & admins to create in-app notifications cleanly
DROP POLICY IF EXISTS "notifications_insert_self_or_enquiry_party" ON public.notifications;
CREATE POLICY "notifications_insert_self_or_enquiry_party"
  ON public.notifications FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_any_admin_role(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.enquiries e
      WHERE (e.customer_id = auth.uid() AND e.owner_id = user_id)
         OR (e.owner_id = auth.uid() AND e.customer_id = user_id)
    )
  );
