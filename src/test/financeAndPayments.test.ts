import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { financeStore, resetFinanceSandboxForTests } from '../services/financeStore';
import { calculateIndianGst, formatRupeesInWords } from '../services/gstInvoice';
import { platformStore, resetSandboxForTests } from '../services/platformStore';
import {
  buildUpiPaymentUri,
  generateUpiQrDataUrl,
  isValidUpiVpa,
  isValidUtrReference,
} from '../services/upiRazorpay';

describe('Phase 5: Subscription, GST Invoice & Razorpay Engine', () => {
  beforeEach(() => {
    resetSandboxForTests();
    resetFinanceSandboxForTests();
  });

  it('computes Indian Intra-State CGST/SGST vs Inter-State IGST and Rupees in Words', () => {
    const intra = calculateIndianGst(1000, 'UP');
    expect(intra.taxType).toBe('INTRA_STATE');
    expect(intra.cgstInr).toBe(90);
    expect(intra.sgstInr).toBe(90);
    expect(intra.igstInr).toBe(0);
    expect(intra.totalAmountInr).toBe(1180);

    const inter = calculateIndianGst(1000, 'KL');
    expect(inter.taxType).toBe('INTER_STATE');
    expect(inter.cgstInr).toBe(0);
    expect(inter.igstInr).toBe(180);
    expect(formatRupeesInWords(1180)).toBe('Rupees One Thousand One Hundred Eighty Only');
  });

  it('requires explicit consent, verifies Razorpay signature, activates plan, and issues GST invoice', async () => {
    const employer = await platformStore.loginWithPassword('employer@example.in', 'Demo@12345');

    await expect(
      financeStore.createSandboxOrder(employer, {
        planCode: 'PROFESSIONAL',
        billingCycle: 'MONTHLY',
        customerStateCode: 'KA',
        idempotencyKey: 'idem-no-consent',
        consentConfirmed: false,
      })
    ).rejects.toThrow(/consent/i);

    const { payment, quote } = await financeStore.createSandboxOrder(employer, {
      planCode: 'PROFESSIONAL',
      billingCycle: 'MONTHLY',
      customerStateCode: 'KA',
      couponCode: 'LAUNCH20',
      idempotencyKey: 'idem-pro-1',
      consentConfirmed: true,
    });
    expect(quote.discountAmountInr).toBe(99.8); // 20% of 499
    expect(payment.status).toBe('CREATED');

    // Invalid signature must fail and NOT activate subscription
    await expect(
      financeStore.verifyRazorpayPayment(employer, {
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: 'pay_bad',
        razorpay_signature: 'invalid_sig',
      })
    ).rejects.toThrow(/signature verification failed/i);
    expect(await financeStore.getEffectiveListingLimit(employer.profile.id)).toBe(1);

    // Valid signature activates subscription & issues invoice
    const { payment: freshOrder } = await financeStore.createSandboxOrder(employer, {
      planCode: 'PROFESSIONAL',
      billingCycle: 'MONTHLY',
      customerStateCode: 'KA',
      idempotencyKey: 'idem-pro-2',
      consentConfirmed: true,
    });
    const sig = await financeStore.generateSandboxValidSignature(freshOrder.razorpay_order_id, 'pay_good_1');
    const verified = await financeStore.verifyRazorpayPayment(employer, {
      razorpay_order_id: freshOrder.razorpay_order_id,
      razorpay_payment_id: 'pay_good_1',
      razorpay_signature: sig,
    });

    expect(verified.payment.status).toBe('SUCCEEDED');
    expect(verified.subscription?.plan_code).toBe('PROFESSIONAL');
    expect(verified.invoice?.tax_type).toBe('INTER_STATE');
    expect(await financeStore.getEffectiveListingLimit(employer.profile.id)).toBe(10);
  });

  it('handles failed payments and deduplicates duplicate Razorpay webhooks safely', async () => {
    const owner = await platformStore.loginWithPassword('owner@example.in', 'Demo@12345');

    const { payment: failOrder } = await financeStore.createSandboxOrder(owner, {
      planCode: 'STARTER',
      billingCycle: 'MONTHLY',
      customerStateCode: 'KL',
      idempotencyKey: 'idem-fail-1',
      consentConfirmed: true,
    });
    const failed = await financeStore.simulatePaymentFailure(failOrder.razorpay_order_id, 'Insufficient funds');
    expect(failed.status).toBe('FAILED');

    const { payment: whOrder } = await financeStore.createSandboxOrder(owner, {
      planCode: 'BUSINESS',
      billingCycle: 'MONTHLY',
      customerStateCode: 'KL',
      idempotencyKey: 'idem-wh-1',
      consentConfirmed: true,
    });

    const first = await financeStore.processRazorpayWebhook({
      webhookEventId: 'evt_rzp_1001',
      eventType: 'payment.captured',
      orderId: whOrder.razorpay_order_id,
      razorpayPaymentId: 'pay_wh_1001',
      customerName: owner.profile.full_name,
    });
    expect(first.deduplicated).toBe(false);
    expect(first.status).toBe('SUCCEEDED');

    // Duplicate webhook delivery must be ignored without creating duplicate invoice/subscription
    const second = await financeStore.processRazorpayWebhook({
      webhookEventId: 'evt_rzp_1001',
      eventType: 'payment.captured',
      orderId: whOrder.razorpay_order_id,
      razorpayPaymentId: 'pay_wh_1001',
      customerName: owner.profile.full_name,
    });
    expect(second.deduplicated).toBe(true);
    const billing = await financeStore.getMyBillingData(owner.profile.id);
    expect(billing.invoices).toHaveLength(1);
    expect(billing.subscriptions).toHaveLength(1);
  });

  it('runs subscription expiry reminders (7d, 3d, 1d, 0d), revokes premium limits on expiry, and processes refunds', async () => {
    const employer = await platformStore.loginWithPassword('employer@example.in', 'Demo@12345');
    const { payment } = await financeStore.createSandboxOrder(employer, {
      planCode: 'STARTER',
      billingCycle: 'MONTHLY',
      customerStateCode: 'UP',
      idempotencyKey: 'idem-exp-1',
      consentConfirmed: true,
    });
    const sig = await financeStore.generateSandboxValidSignature(payment.razorpay_order_id, 'pay_exp_1');
    const res = await financeStore.verifyRazorpayPayment(employer, {
      razorpay_order_id: payment.razorpay_order_id,
      razorpay_payment_id: 'pay_exp_1',
      razorpay_signature: sig,
    });
    const subId = res.subscription!.id;

    // 6 days before expiry -> 7D reminder
    const base = new Date('2026-12-01T00:00:00Z');
    await financeStore.setSubscriptionExpiryForTesting(subId, new Date(base.getTime() + 6 * 86400000).toISOString());
    const sweep7 = await financeStore.runSubscriptionExpirySweep(base);
    expect(sweep7.remindersSent).toBe(1);
    expect(sweep7.expiredCount).toBe(0);

    // Past expiry -> 0D expired & limit reverts to FREE (1)
    await financeStore.setSubscriptionExpiryForTesting(subId, new Date(base.getTime() - 1000).toISOString());
    const sweep0 = await financeStore.runSubscriptionExpirySweep(base);
    expect(sweep0.expiredCount).toBe(1);
    expect(await financeStore.getEffectiveListingLimit(employer.profile.id)).toBe(1);

    // Refund request & Admin Finance processing
    const refundReq = await financeStore.requestRefund(employer, payment.id, 'Duplicate purchase');
    await expect(financeStore.adminProcessRefund(employer, refundReq.id, 'PROCESSED')).rejects.toThrow(/Unauthorized/i);

    const admin = await platformStore.loginWithPassword('admin@shalomconnecthub.in', 'Admin@12345');
    const processed = await financeStore.adminProcessRefund(admin, refundReq.id, 'PROCESSED');
    expect(processed.status).toBe('PROCESSED');
    const updatedBilling = await financeStore.getMyBillingData(employer.profile.id);
    expect(updatedBilling.payments[0].status).toBe('REFUNDED');
    expect(updatedBilling.invoices[0].status).toBe('REFUNDED');
  });

  it('enforces Row Level Security on all 11 Phase 5 Financial tables in SQL', () => {
    const sql = readFileSync(
      resolve(process.cwd(), 'supabase/migrations/202611250007_phase5_financial_engine.sql'),
      'utf8'
    );
    const tables = Array.from(sql.matchAll(/CREATE TABLE IF NOT EXISTS public\.([a-z_]+)/g)).map(
      (m: RegExpExecArray) => m[1]
    );
    expect(tables).toHaveLength(11);
    for (const table of tables) {
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    }
  });

  it('builds 7379325499@ybl UPI intent URI, generates QR code, keeps UTR PENDING until admin verification, and activates after approval', async () => {
    expect(isValidUpiVpa('7379325499@ybl')).toBe(true);
    expect(isValidUpiVpa('invalid-vpa')).toBe(false);
    expect(isValidUtrReference('432910293847')).toBe(true);
    expect(isValidUtrReference('123')).toBe(false);

    const gw = await financeStore.getGatewayConfig();
    expect(gw.upi_vpa).toBe('7379325499@ybl');

    const uri = buildUpiPaymentUri({
      upiVpa: gw.upi_vpa,
      payeeName: gw.payee_name,
      amountInr: 588.82,
      transactionRef: 'order_sbx_upi_1',
      note: 'PROFESSIONAL MONTHLY',
    });
    expect(uri).toContain('upi://pay?');
    expect(uri).toContain('pa=7379325499%40ybl');
    expect(uri).toContain('am=588.82');

    const qrDataUrl = await generateUpiQrDataUrl(uri);
    expect(qrDataUrl.startsWith('data:image/png;base64,')).toBe(true);

    const employer = await platformStore.loginWithPassword('employer@example.in', 'Demo@12345');
    const { payment } = await financeStore.createSandboxOrder(employer, {
      planCode: 'PROFESSIONAL',
      billingCycle: 'MONTHLY',
      customerStateCode: 'UP',
      idempotencyKey: 'idem-upi-qr-1',
      consentConfirmed: true,
      paymentMethod: 'UPI_INTENT_QR',
    });
    expect(payment.payment_method).toBe('UPI_INTENT_QR');
    expect(payment.upi_vpa).toBe('7379325499@ybl');

    const submitted = await financeStore.submitUpiUtrForVerification(
      employer,
      payment.razorpay_order_id,
      '432910293847'
    );
    // Strict security rule: UTR submission NEVER activates subscription or marks SUCCEEDED without backend/admin verification
    expect(submitted.status).toBe('PENDING');
    expect(submitted.upi_verification_status).toBe('PENDING_VERIFICATION');
    expect(await financeStore.getEffectiveListingLimit(employer.profile.id)).toBe(1);

    await expect(
      financeStore.adminVerifyUpiPayment(employer, payment.id, employer.profile.full_name, true)
    ).rejects.toThrow(/Unauthorized/i);
    await expect(
      financeStore.adminUpdateGatewayConfig(employer, { upi_vpa: 'hacker@ybl' })
    ).rejects.toThrow(/Unauthorized/i);

    const admin = await platformStore.loginWithPassword('admin@shalomconnecthub.in', 'Admin@12345');
    const verified = await financeStore.adminVerifyUpiPayment(
      admin,
      payment.id,
      employer.profile.full_name,
      true,
      'Matched UTR in YBL statement'
    );
    expect(verified.payment.status).toBe('SUCCEEDED');
    expect(verified.payment.upi_verification_status).toBe('VERIFIED');
    expect(verified.subscription?.plan_code).toBe('PROFESSIONAL');
    expect(verified.invoice?.tax_type).toBe('INTRA_STATE');
    expect(await financeStore.getEffectiveListingLimit(employer.profile.id)).toBe(10);

    // Also verify 202611250011 migration contains 7379325499@ybl and unique UTR index
    const migrationSql = readFileSync(
      resolve(process.cwd(), 'supabase/migrations/202611250011_razorpay_upi_config.sql'),
      'utf8'
    );
    expect(migrationSql).toContain('7379325499@ybl');
    expect(migrationSql).toContain('payment_gateway_config');
    expect(migrationSql).toContain('idx_payments_upi_utr_unique');
  });
});
