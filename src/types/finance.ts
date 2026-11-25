export type BillingCycle = 'MONTHLY' | 'ANNUAL' | 'ONE_TIME';
export type SubscriptionStatus = 'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type ReminderStage = 'NONE' | '7D' | '3D' | '1D' | '0D';

export type PaymentPurpose =
  | 'SUBSCRIPTION'
  | 'FEATURED_LISTING'
  | 'LISTING_CREDIT'
  | 'ENQUIRY_FEE'
  | 'SERVICE_CHARGE';

export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description: string;
  monthly_price_inr: number;
  annual_price_inr: number;
  listing_limit: number;
  user_limit: number;
  enquiry_limit: number;
  featured_credits: number;
  auto_renew_allowed: boolean;
  is_highlight: boolean;
  is_active: boolean;
  sort_order: number;
  features: string[];
}

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  plan_id: string;
  plan_code: string;
  plan_name: string;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  starts_at: string | null;
  expires_at: string | null;
  auto_renew_authorized: boolean;
  last_reminder_stage: ReminderStage;
  created_at: string;
}

export type PaymentMethod = 'RAZORPAY_CHECKOUT' | 'UPI_INTENT_QR';
export type UpiVerificationStatus = 'NONE' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';

export interface PaymentGatewayConfig {
  upi_vpa: string;
  payee_name: string;
  razorpay_enabled: boolean;
  razorpay_key_id?: string;
  upi_qr_enabled: boolean;
  mode: 'SANDBOX' | 'LIVE';
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  subscription_id: string | null;
  purpose: PaymentPurpose;
  payment_method: PaymentMethod;
  upi_vpa: string | null;
  upi_utr_reference: string | null;
  upi_verification_status: UpiVerificationStatus;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  razorpay_signature_verified: boolean;
  idempotency_key: string;
  base_amount_inr: number;
  discount_amount_inr: number;
  tax_amount_inr: number;
  total_amount_inr: number;
  currency: 'INR';
  status: PaymentStatus;
  failure_reason: string | null;
  consent_confirmed: boolean;
  plan_code?: string;
  billing_cycle?: BillingCycle;
  customer_state_code: string;
  created_at: string;
}

export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  payment_id: string;
  user_id: string;
  customer_name: string;
  customer_gstin: string | null;
  customer_state_code: string;
  supplier_state_code: string;
  tax_type: 'INTRA_STATE' | 'INTER_STATE';
  taxable_amount_inr: number;
  cgst_inr: number;
  sgst_inr: number;
  igst_inr: number;
  total_amount_inr: number;
  amount_in_words: string;
  status: 'ISSUED' | 'VOID' | 'REFUNDED';
  issued_at: string;
}

export interface RefundRecord {
  id: string;
  payment_id: string;
  user_id: string;
  razorpay_refund_id: string | null;
  amount_inr: number;
  reason: string;
  status: 'REQUESTED' | 'PROCESSED' | 'FAILED' | 'REJECTED';
  processed_at: string | null;
  created_at: string;
}

export interface ServiceChargeRule {
  id: string;
  module_key: string;
  service_type: string;
  charge_type: 'FIXED' | 'PERCENTAGE' | 'PER_LISTING' | 'PER_LEAD';
  amount_or_rate: number;
  gst_percent: number;
  terms_and_conditions: string;
  is_active: boolean;
}

export interface CommissionRule {
  id: string;
  module_key: string;
  service_type: string;
  charge_type: 'FIXED' | 'PERCENTAGE' | 'PLACEMENT_FEE' | 'FACILITATION_FEE';
  rate_or_amount: number;
  gst_percent: number;
  requires_contract_consent: boolean;
  terms_and_conditions: string;
  is_active: boolean;
}

export interface PromoCoupon {
  id: string;
  code: string;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: number;
  is_active: boolean;
}

export interface CheckoutQuote {
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  baseAmountInr: number;
  discountAmountInr: number;
  taxableAmountInr: number;
  taxType: 'INTRA_STATE' | 'INTER_STATE';
  cgstInr: number;
  sgstInr: number;
  igstInr: number;
  totalTaxInr: number;
  totalAmountInr: number;
  appliedCouponCode: string | null;
}
