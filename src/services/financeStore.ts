import { getSupabaseClient } from '../lib/supabase';
import type { UserWithRoles } from '../types/domain';
import type {
  BillingCycle,
  CheckoutQuote,
  CommissionRule,
  InvoiceRecord,
  PaymentGatewayConfig,
  PaymentMethod,
  PaymentRecord,
  PromoCoupon,
  RefundRecord,
  ReminderStage,
  ServiceChargeRule,
  SubscriptionPlan,
  SubscriptionRecord,
} from '../types/finance';
import { calculateIndianGst, formatRupeesInWords, SUPPLIER_STATE_CODE } from './gstInvoice';
import { hasAdminScope } from './permissions';
import { isValidUpiVpa, isValidUtrReference } from './upiRazorpay';

const FINANCE_SANDBOX_KEY = 'shalom_connecthub_finance_v1';

interface FinanceSandboxState {
  gatewayConfig: PaymentGatewayConfig;
  plans: SubscriptionPlan[];
  subscriptions: SubscriptionRecord[];
  payments: PaymentRecord[];
  invoices: InvoiceRecord[];
  refunds: RefundRecord[];
  serviceCharges: ServiceChargeRule[];
  commissionRules: CommissionRule[];
  coupons: PromoCoupon[];
  processedWebhookKeys: string[];
  invoiceSeq: number;
  reminderLogs: Array<{ subscription_id: string; user_id: string; stage: ReminderStage; created_at: string }>;
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return `${prefix}-${rand}`;
}

export async function computeHmacSha256Hex(secret: string, message: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
    return Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Deterministic fallback if WebCrypto unavailable
  return `sig_${secret.length}_${message}`;
}

const SANDBOX_RAZORPAY_SECRET = 'rzp_sandbox_secret_test_only';

function buildInitialFinanceSandbox(): FinanceSandboxState {
  const plans: SubscriptionPlan[] = [
    {
      id: 'plan-free',
      code: 'FREE',
      name: 'Free',
      description: '1 active eligible listing across India',
      monthly_price_inr: 0,
      annual_price_inr: 0,
      listing_limit: 1,
      user_limit: 1,
      enquiry_limit: 25,
      featured_credits: 0,
      auto_renew_allowed: false,
      is_highlight: false,
      is_active: true,
      sort_order: 10,
      features: ['1 active eligible listing', 'All-India location visibility', 'Standard enquiry inbox'],
    },
    {
      id: 'plan-starter',
      code: 'STARTER',
      name: 'Starter',
      description: 'Up to 3 active listings with GST invoice',
      monthly_price_inr: 199,
      annual_price_inr: 1990,
      listing_limit: 3,
      user_limit: 1,
      enquiry_limit: 100,
      featured_credits: 1,
      auto_renew_allowed: false,
      is_highlight: false,
      is_active: true,
      sort_order: 20,
      features: ['Up to 3 active listings', '1 featured listing credit', 'Email notifications', 'GST invoice'],
    },
    {
      id: 'plan-pro',
      code: 'PROFESSIONAL',
      name: 'Professional',
      description: 'Up to 10 active listings for teams & institutions',
      monthly_price_inr: 499,
      annual_price_inr: 4990,
      listing_limit: 10,
      user_limit: 3,
      enquiry_limit: 500,
      featured_credits: 3,
      auto_renew_allowed: false,
      is_highlight: true,
      is_active: true,
      sort_order: 30,
      features: ['Up to 10 active listings', '3 featured listing credits', '3 team members', 'GST tax invoice'],
    },
    {
      id: 'plan-biz',
      code: 'BUSINESS',
      name: 'Business',
      description: 'Up to 30 active listings for agencies & recruiters',
      monthly_price_inr: 999,
      annual_price_inr: 9990,
      listing_limit: 30,
      user_limit: 10,
      enquiry_limit: 2000,
      featured_credits: 10,
      auto_renew_allowed: false,
      is_highlight: false,
      is_active: true,
      sort_order: 40,
      features: ['Up to 30 active listings', '10 featured credits', '10 org members', 'Priority support'],
    },
    {
      id: 'plan-prem',
      code: 'PREMIUM',
      name: 'Premium',
      description: 'Up to 100 active listings enterprise tier',
      monthly_price_inr: 1999,
      annual_price_inr: 19990,
      listing_limit: 100,
      user_limit: 25,
      enquiry_limit: 10000,
      featured_credits: 25,
      auto_renew_allowed: false,
      is_highlight: false,
      is_active: true,
      sort_order: 50,
      features: ['Up to 100 active listings', '25 featured credits', '25 org members', 'Priority moderation'],
    },
  ];

  const serviceCharges: ServiceChargeRule[] = [
    {
      id: 'sc-1',
      module_key: 'property',
      service_type: 'FEATURED_PROPERTY_7D',
      charge_type: 'FIXED',
      amount_or_rate: 299,
      gst_percent: 18,
      terms_and_conditions: '7-day featured property highlight; explicit consent required before checkout.',
      is_active: true,
    },
    {
      id: 'sc-2',
      module_key: 'staff',
      service_type: 'FEATURED_JOB_14D',
      charge_type: 'FIXED',
      amount_or_rate: 249,
      gst_percent: 18,
      terms_and_conditions: '14-day priority job placement; explicit consent required before checkout.',
      is_active: true,
    },
  ];

  const commissionRules: CommissionRule[] = [
    {
      id: 'cr-1',
      module_key: 'staff',
      service_type: 'SUCCESSFUL_PLACEMENT_ASSIST',
      charge_type: 'PLACEMENT_FEE',
      rate_or_amount: 2,
      gst_percent: 18,
      requires_contract_consent: true,
      terms_and_conditions: 'Applies only with signed employer recruitment terms; never auto-deducted.',
      is_active: true,
    },
    {
      id: 'cr-2',
      module_key: 'property',
      service_type: 'FACILITATION_AGREEMENT',
      charge_type: 'FACILITATION_FEE',
      rate_or_amount: 1,
      gst_percent: 18,
      requires_contract_consent: true,
      terms_and_conditions: 'Applies only with signed bilateral facilitation agreement.',
      is_active: true,
    },
  ];

  const coupons: PromoCoupon[] = [
    { id: 'cpn-1', code: 'LAUNCH20', discount_type: 'PERCENT', discount_value: 20, is_active: true },
    { id: 'cpn-2', code: 'FLAT100', discount_type: 'FIXED', discount_value: 100, is_active: true },
  ];

  return {
    gatewayConfig: {
      upi_vpa: '7379325499@ybl',
      payee_name: 'SHALOM CONNECTHUB INDIA',
      razorpay_enabled: true,
      upi_qr_enabled: true,
      mode: 'SANDBOX',
    },
    plans,
    subscriptions: [],
    payments: [],
    invoices: [],
    refunds: [],
    serviceCharges,
    commissionRules,
    coupons,
    processedWebhookKeys: [],
    invoiceSeq: 1001,
    reminderLogs: [],
  };
}

let financeMemoryFallback: FinanceSandboxState | null = null;

function readFinanceSandbox(): FinanceSandboxState {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(FINANCE_SANDBOX_KEY);
      if (raw) return JSON.parse(raw) as FinanceSandboxState;
    } catch {
      // Fallback
    }
  }
  if (!financeMemoryFallback) {
    financeMemoryFallback = buildInitialFinanceSandbox();
  }
  return financeMemoryFallback;
}

function writeFinanceSandbox(state: FinanceSandboxState): void {
  financeMemoryFallback = state;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(FINANCE_SANDBOX_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }
}

export function resetFinanceSandboxForTests(): void {
  writeFinanceSandbox(buildInitialFinanceSandbox());
}

function finalizeSuccessfulPayment(
  state: FinanceSandboxState,
  payment: PaymentRecord,
  razorpayPaymentId: string,
  customerName: string
): { payment: PaymentRecord; subscription: SubscriptionRecord | null; invoice: InvoiceRecord | null } {
  if (payment.status === 'SUCCEEDED') {
    const existingSub = state.subscriptions.find((s) => s.id === payment.subscription_id) ?? null;
    const existingInv = state.invoices.find((i) => i.payment_id === payment.id) ?? null;
    return { payment, subscription: existingSub, invoice: existingInv };
  }

  payment.razorpay_payment_id = razorpayPaymentId;
  payment.razorpay_signature_verified = true;
  payment.status = 'SUCCEEDED';
  payment.failure_reason = null;

  let activatedSub: SubscriptionRecord | null = null;
  if (payment.purpose === 'SUBSCRIPTION' && payment.plan_code) {
    const plan = state.plans.find((p) => p.code === payment.plan_code);
    if (plan) {
      for (const s of state.subscriptions) {
        if (s.user_id === payment.user_id && s.status === 'ACTIVE') {
          s.status = 'EXPIRED';
        }
      }
      const startsAt = new Date();
      const days = payment.billing_cycle === 'ANNUAL' ? 365 : 30;
      const expiresAt = new Date(startsAt.getTime() + days * 24 * 60 * 60 * 1000);
      activatedSub = {
        id: makeId('sub'),
        user_id: payment.user_id,
        plan_id: plan.id,
        plan_code: plan.code,
        plan_name: plan.name,
        billing_cycle: payment.billing_cycle ?? 'MONTHLY',
        status: 'ACTIVE',
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        auto_renew_authorized: false,
        last_reminder_stage: 'NONE',
        created_at: nowIso(),
      };
      state.subscriptions.unshift(activatedSub);
      payment.subscription_id = activatedSub.id;
    }
  }

  let issuedInvoice: InvoiceRecord | null = null;
  const existingInv = state.invoices.find((i) => i.payment_id === payment.id);
  if (!existingInv && payment.total_amount_inr > 0) {
    const taxable = Math.max(0, payment.base_amount_inr - payment.discount_amount_inr);
    const gst = calculateIndianGst(taxable, payment.customer_state_code);
    const invNum = `SCHI-2026-${state.invoiceSeq++}`;
    issuedInvoice = {
      id: makeId('inv'),
      invoice_number: invNum,
      payment_id: payment.id,
      user_id: payment.user_id,
      customer_name: customerName,
      customer_gstin: null,
      customer_state_code: payment.customer_state_code,
      supplier_state_code: SUPPLIER_STATE_CODE,
      tax_type: gst.taxType,
      taxable_amount_inr: gst.taxableAmountInr,
      cgst_inr: gst.cgstInr,
      sgst_inr: gst.sgstInr,
      igst_inr: gst.igstInr,
      total_amount_inr: gst.totalAmountInr,
      amount_in_words: formatRupeesInWords(gst.totalAmountInr),
      status: 'ISSUED',
      issued_at: nowIso(),
    };
    state.invoices.unshift(issuedInvoice);
  }

  return { payment, subscription: activatedSub, invoice: issuedInvoice };
}

export const financeStore = {
  async getGatewayConfig(): Promise<PaymentGatewayConfig> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'payment_gateway_config')
        .maybeSingle();
      if (data?.value) {
        return data.value as PaymentGatewayConfig;
      }
    }
    return { ...readFinanceSandbox().gatewayConfig };
  },

  async adminUpdateGatewayConfig(
    actor: UserWithRoles,
    updates: Partial<PaymentGatewayConfig>
  ): Promise<PaymentGatewayConfig> {
    if (!hasAdminScope(actor.roles, 'finance')) {
      throw new Error('Unauthorized: Finance Admin permission required.');
    }
    if (updates.upi_vpa && !isValidUpiVpa(updates.upi_vpa)) {
      throw new Error('Invalid UPI VPA format (example: 7379325499@ybl).');
    }
    const state = readFinanceSandbox();
    state.gatewayConfig = { ...state.gatewayConfig, ...updates };
    writeFinanceSandbox(state);

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase
        .from('platform_settings')
        .upsert({
          key: 'payment_gateway_config',
          value: state.gatewayConfig,
          category: 'FINANCE',
          is_public: true,
        });
    }
    return state.gatewayConfig;
  },

  async getPlans(includeInactive = false): Promise<SubscriptionPlan[]> {
    const state = readFinanceSandbox();
    return [...state.plans]
      .filter((p) => includeInactive || p.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  },

  async getServiceCharges(): Promise<ServiceChargeRule[]> {
    return [...readFinanceSandbox().serviceCharges];
  },

  async getCommissionRules(): Promise<CommissionRule[]> {
    return [...readFinanceSandbox().commissionRules];
  },

  async previewPlanCheckout(input: {
    planCode: string;
    billingCycle: BillingCycle;
    customerStateCode: string;
    couponCode?: string;
  }): Promise<CheckoutQuote> {
    const state = readFinanceSandbox();
    const plan = state.plans.find((p) => p.code === input.planCode && p.is_active);
    if (!plan) throw new Error('Selected subscription plan is not available.');

    const baseAmountInr =
      input.billingCycle === 'ANNUAL' ? plan.annual_price_inr : plan.monthly_price_inr;

    let discountAmountInr = 0;
    let appliedCouponCode: string | null = null;
    if (input.couponCode?.trim()) {
      const coupon = state.coupons.find(
        (c) => c.code === input.couponCode!.trim().toUpperCase() && c.is_active
      );
      if (!coupon) throw new Error('Invalid or expired promotional coupon code.');
      appliedCouponCode = coupon.code;
      discountAmountInr =
        coupon.discount_type === 'PERCENT'
          ? Math.round(((baseAmountInr * coupon.discount_value) / 100) * 100) / 100
          : Math.min(baseAmountInr, coupon.discount_value);
    }

    const taxable = Math.max(0, baseAmountInr - discountAmountInr);
    const gst = calculateIndianGst(taxable, input.customerStateCode || SUPPLIER_STATE_CODE);

    return {
      plan,
      billingCycle: input.billingCycle,
      baseAmountInr,
      discountAmountInr,
      taxableAmountInr: gst.taxableAmountInr,
      taxType: gst.taxType,
      cgstInr: gst.cgstInr,
      sgstInr: gst.sgstInr,
      igstInr: gst.igstInr,
      totalTaxInr: gst.totalTaxInr,
      totalAmountInr: gst.totalAmountInr,
      appliedCouponCode,
    };
  },

  async createSandboxOrder(
    user: UserWithRoles,
    input: {
      planCode: string;
      billingCycle: BillingCycle;
      customerStateCode: string;
      couponCode?: string;
      idempotencyKey: string;
      consentConfirmed: boolean;
      paymentMethod?: PaymentMethod;
    }
  ): Promise<{ payment: PaymentRecord; quote: CheckoutQuote }> {
    if (!input.consentConfirmed) {
      throw new Error('Explicit customer consent is required before initiating payment.');
    }

    const state = readFinanceSandbox();
    const existing = state.payments.find((p) => p.idempotency_key === input.idempotencyKey);
    const quote = await this.previewPlanCheckout(input);
    if (existing) {
      return { payment: existing, quote };
    }

    const method: PaymentMethod = input.paymentMethod ?? 'RAZORPAY_CHECKOUT';

    // Free ₹0 plan activates directly without gateway charge
    const payment: PaymentRecord = {
      id: makeId('pay'),
      user_id: user.profile.id,
      subscription_id: null,
      purpose: 'SUBSCRIPTION',
      payment_method: method,
      upi_vpa: method === 'UPI_INTENT_QR' ? state.gatewayConfig.upi_vpa : null,
      upi_utr_reference: null,
      upi_verification_status: 'NONE',
      razorpay_order_id: `order_sbx_${Math.random().toString(36).slice(2, 11)}`,
      razorpay_payment_id: null,
      razorpay_signature_verified: false,
      idempotency_key: input.idempotencyKey,
      base_amount_inr: quote.baseAmountInr,
      discount_amount_inr: quote.discountAmountInr,
      tax_amount_inr: quote.totalTaxInr,
      total_amount_inr: quote.totalAmountInr,
      currency: 'INR',
      status: 'CREATED',
      failure_reason: null,
      consent_confirmed: true,
      plan_code: quote.plan.code,
      billing_cycle: input.billingCycle,
      customer_state_code: input.customerStateCode || SUPPLIER_STATE_CODE,
      created_at: nowIso(),
    };
    state.payments.unshift(payment);

    if (quote.totalAmountInr === 0) {
      finalizeSuccessfulPayment(state, payment, `pay_free_${Date.now()}`, user.profile.full_name);
    }

    writeFinanceSandbox(state);
    return { payment, quote };
  },

  async submitUpiUtrForVerification(
    user: UserWithRoles,
    orderId: string,
    utrReference: string
  ): Promise<PaymentRecord> {
    const cleanUtr = utrReference.trim();
    if (!isValidUtrReference(cleanUtr)) {
      throw new Error('Enter a valid 10–22 character alphanumeric UPI UTR / Reference number.');
    }
    const state = readFinanceSandbox();
    const payment = state.payments.find(
      (p) => p.razorpay_order_id === orderId && p.user_id === user.profile.id
    );
    if (!payment) throw new Error('Payment order not found.');
    if (payment.status === 'SUCCEEDED') return payment;

    if (state.payments.some((p) => p.id !== payment.id && p.upi_utr_reference === cleanUtr)) {
      throw new Error('This UTR reference number has already been submitted.');
    }

    // Never mark SUCCEEDED from client UTR entry alone — awaits backend / Finance Admin verification
    payment.payment_method = 'UPI_INTENT_QR';
    payment.upi_vpa = state.gatewayConfig.upi_vpa;
    payment.upi_utr_reference = cleanUtr;
    payment.upi_verification_status = 'PENDING_VERIFICATION';
    payment.status = 'PENDING';
    writeFinanceSandbox(state);
    return payment;
  },

  async adminVerifyUpiPayment(
    actor: UserWithRoles,
    paymentId: string,
    customerName: string,
    approved: boolean,
    notes?: string
  ): Promise<{ payment: PaymentRecord; subscription: SubscriptionRecord | null; invoice: InvoiceRecord | null }> {
    if (!hasAdminScope(actor.roles, 'finance')) {
      throw new Error('Unauthorized: Finance Admin permission required.');
    }
    const state = readFinanceSandbox();
    const payment = state.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Payment not found.');

    if (!approved) {
      payment.upi_verification_status = 'REJECTED';
      payment.status = 'FAILED';
      payment.failure_reason = notes?.trim() || 'UTR could not be verified against bank settlement.';
      writeFinanceSandbox(state);
      return { payment, subscription: null, invoice: null };
    }

    payment.upi_verification_status = 'VERIFIED';
    const res = finalizeSuccessfulPayment(
      state,
      payment,
      `upi_utr_${payment.upi_utr_reference || Date.now()}`,
      customerName
    );
    writeFinanceSandbox(state);
    return res;
  },

  async generateSandboxValidSignature(orderId: string, razorpayPaymentId: string): Promise<string> {
    return computeHmacSha256Hex(SANDBOX_RAZORPAY_SECRET, `${orderId}|${razorpayPaymentId}`);
  },

  async verifyRazorpayPayment(
    user: UserWithRoles,
    payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
  ): Promise<{ payment: PaymentRecord; subscription: SubscriptionRecord | null; invoice: InvoiceRecord | null }> {
    const state = readFinanceSandbox();
    const payment = state.payments.find((p) => p.razorpay_order_id === payload.razorpay_order_id);
    if (!payment) throw new Error('Payment order not found.');

    const expected = await computeHmacSha256Hex(
      SANDBOX_RAZORPAY_SECRET,
      `${payload.razorpay_order_id}|${payload.razorpay_payment_id}`
    );
    if (payload.razorpay_signature !== expected) {
      payment.status = 'FAILED';
      payment.failure_reason = 'Invalid Razorpay signature';
      writeFinanceSandbox(state);
      throw new Error('Payment signature verification failed. Payment not marked successful.');
    }

    const res = finalizeSuccessfulPayment(state, payment, payload.razorpay_payment_id, user.profile.full_name);
    writeFinanceSandbox(state);
    return res;
  },

  async simulatePaymentFailure(orderId: string, reason: string): Promise<PaymentRecord> {
    const state = readFinanceSandbox();
    const payment = state.payments.find((p) => p.razorpay_order_id === orderId);
    if (!payment) throw new Error('Payment order not found.');
    if (payment.status === 'SUCCEEDED') {
      throw new Error('Cannot fail an already succeeded payment.');
    }
    payment.status = 'FAILED';
    payment.failure_reason = reason || 'Bank declined / payment cancelled';
    writeFinanceSandbox(state);
    return payment;
  },

  async processRazorpayWebhook(input: {
    webhookEventId: string;
    eventType: 'payment.captured' | 'payment.failed';
    orderId: string;
    razorpayPaymentId?: string;
    failureReason?: string;
    customerName?: string;
  }): Promise<{ deduplicated: boolean; status: string }> {
    const state = readFinanceSandbox();
    if (state.processedWebhookKeys.includes(input.webhookEventId)) {
      return { deduplicated: true, status: 'ALREADY_PROCESSED' };
    }

    const payment = state.payments.find((p) => p.razorpay_order_id === input.orderId);
    if (!payment) throw new Error('Webhook order not found.');

    state.processedWebhookKeys.push(input.webhookEventId);
    if (input.eventType === 'payment.captured') {
      finalizeSuccessfulPayment(
        state,
        payment,
        input.razorpayPaymentId || `pay_wh_${Date.now()}`,
        input.customerName || 'Customer'
      );
    } else if (input.eventType === 'payment.failed' && payment.status !== 'SUCCEEDED') {
      payment.status = 'FAILED';
      payment.failure_reason = input.failureReason || 'Gateway payment failed';
    }

    writeFinanceSandbox(state);
    return { deduplicated: false, status: payment.status };
  },

  async getMyBillingData(userId: string): Promise<{
    subscriptions: SubscriptionRecord[];
    payments: PaymentRecord[];
    invoices: InvoiceRecord[];
    refunds: RefundRecord[];
  }> {
    const state = readFinanceSandbox();
    return {
      subscriptions: state.subscriptions.filter((s) => s.user_id === userId),
      payments: state.payments.filter((p) => p.user_id === userId),
      invoices: state.invoices.filter((i) => i.user_id === userId),
      refunds: state.refunds.filter((r) => r.user_id === userId),
    };
  },

  async getEffectiveListingLimit(userId: string): Promise<number> {
    const state = readFinanceSandbox();
    const active = state.subscriptions.find(
      (s) => s.user_id === userId && s.status === 'ACTIVE' && (!s.expires_at || new Date(s.expires_at).getTime() > Date.now())
    );
    if (!active) {
      return state.plans.find((p) => p.code === 'FREE')?.listing_limit ?? 1;
    }
    return state.plans.find((p) => p.id === active.plan_id)?.listing_limit ?? 1;
  },

  async requestRefund(user: UserWithRoles, paymentId: string, reason: string): Promise<RefundRecord> {
    if (!reason.trim()) throw new Error('Refund reason is required.');
    const state = readFinanceSandbox();
    const payment = state.payments.find((p) => p.id === paymentId && p.user_id === user.profile.id);
    if (!payment) throw new Error('Payment record not found.');
    if (payment.status !== 'SUCCEEDED') throw new Error('Only succeeded payments can be refunded.');

    const refund: RefundRecord = {
      id: makeId('ref'),
      payment_id: payment.id,
      user_id: user.profile.id,
      razorpay_refund_id: null,
      amount_inr: payment.total_amount_inr,
      reason: reason.trim(),
      status: 'REQUESTED',
      processed_at: null,
      created_at: nowIso(),
    };
    state.refunds.unshift(refund);
    writeFinanceSandbox(state);
    return refund;
  },

  // --------------------------------------------------------------------------
  // Subscription Expiry Automation (7D / 3D / 1D / 0D)
  // --------------------------------------------------------------------------
  async runSubscriptionExpirySweep(referenceNow = new Date()): Promise<{
    remindersSent: number;
    expiredCount: number;
  }> {
    const state = readFinanceSandbox();
    let remindersSent = 0;
    let expiredCount = 0;

    for (const sub of state.subscriptions) {
      if (sub.status !== 'ACTIVE' || !sub.expires_at) continue;
      const msLeft = new Date(sub.expires_at).getTime() - referenceNow.getTime();
      const daysLeft = msLeft / (24 * 60 * 60 * 1000);

      let stage: ReminderStage | null = null;
      if (daysLeft <= 0) {
        stage = '0D';
        sub.status = 'EXPIRED';
        expiredCount += 1;
      } else if (daysLeft <= 1 && sub.last_reminder_stage !== '1D') {
        stage = '1D';
      } else if (daysLeft <= 3 && !['3D', '1D'].includes(sub.last_reminder_stage)) {
        stage = '3D';
      } else if (daysLeft <= 7 && sub.last_reminder_stage === 'NONE') {
        stage = '7D';
      }

      if (stage && sub.last_reminder_stage !== stage) {
        sub.last_reminder_stage = stage;
        state.reminderLogs.unshift({
          subscription_id: sub.id,
          user_id: sub.user_id,
          stage,
          created_at: referenceNow.toISOString(),
        });
        remindersSent += 1;
      }
    }

    writeFinanceSandbox(state);
    return { remindersSent, expiredCount };
  },

  async setSubscriptionExpiryForTesting(subscriptionId: string, expiresAtIso: string): Promise<void> {
    const state = readFinanceSandbox();
    const sub = state.subscriptions.find((s) => s.id === subscriptionId);
    if (!sub) throw new Error('Subscription not found.');
    sub.expires_at = expiresAtIso;
    writeFinanceSandbox(state);
  },

  // --------------------------------------------------------------------------
  // Admin Finance Control Centre APIs
  // --------------------------------------------------------------------------
  async adminUpdatePlan(
    actor: UserWithRoles,
    planId: string,
    updates: Partial<Pick<SubscriptionPlan, 'name' | 'monthly_price_inr' | 'annual_price_inr' | 'listing_limit' | 'user_limit' | 'is_active'>>
  ): Promise<SubscriptionPlan> {
    if (!hasAdminScope(actor.roles, 'finance')) {
      throw new Error('Unauthorized: Finance Admin permission required.');
    }
    const state = readFinanceSandbox();
    const plan = state.plans.find((p) => p.id === planId);
    if (!plan) throw new Error('Plan not found.');
    Object.assign(plan, updates);
    writeFinanceSandbox(state);
    return plan;
  },

  async adminGetFinanceOverview(actor: UserWithRoles): Promise<{
    plans: SubscriptionPlan[];
    subscriptions: SubscriptionRecord[];
    payments: PaymentRecord[];
    invoices: InvoiceRecord[];
    refunds: RefundRecord[];
    serviceCharges: ServiceChargeRule[];
    commissionRules: CommissionRule[];
    reminderLogs: FinanceSandboxState['reminderLogs'];
    gatewayConfig: PaymentGatewayConfig;
  }> {
    if (!hasAdminScope(actor.roles, 'finance')) {
      throw new Error('Unauthorized: Finance Admin permission required.');
    }
    const state = readFinanceSandbox();
    return {
      plans: state.plans,
      subscriptions: state.subscriptions,
      payments: state.payments,
      invoices: state.invoices,
      refunds: state.refunds,
      serviceCharges: state.serviceCharges,
      commissionRules: state.commissionRules,
      reminderLogs: state.reminderLogs,
      gatewayConfig: state.gatewayConfig,
    };
  },

  async adminProcessRefund(
    actor: UserWithRoles,
    refundId: string,
    decision: 'PROCESSED' | 'REJECTED'
  ): Promise<RefundRecord> {
    if (!hasAdminScope(actor.roles, 'finance')) {
      throw new Error('Unauthorized: Finance Admin permission required.');
    }
    const state = readFinanceSandbox();
    const ref = state.refunds.find((r) => r.id === refundId);
    if (!ref) throw new Error('Refund not found.');
    ref.status = decision;
    ref.processed_at = nowIso();
    if (decision === 'PROCESSED') {
      ref.razorpay_refund_id = `rfnd_sbx_${Math.random().toString(36).slice(2, 10)}`;
      const payment = state.payments.find((p) => p.id === ref.payment_id);
      if (payment) payment.status = 'REFUNDED';
      const inv = state.invoices.find((i) => i.payment_id === ref.payment_id);
      if (inv) inv.status = 'REFUNDED';
    }
    writeFinanceSandbox(state);
    return ref;
  },
};
