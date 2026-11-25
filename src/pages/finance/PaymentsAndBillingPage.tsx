import { CheckCircle2, CreditCard, FileText, RefreshCw, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ErrorBanner, LoadingState, SuccessBanner } from '../../components/common/StateViews';
import { useAuth } from '../../context/AuthContext';
import { financeStore } from '../../services/financeStore';
import type {
  BillingCycle,
  CheckoutQuote,
  InvoiceRecord,
  PaymentRecord,
  RefundRecord,
  SubscriptionPlan,
  SubscriptionRecord,
} from '../../types/finance';

export function PaymentsAndBillingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [listingLimit, setListingLimit] = useState(1);

  const [selectedPlanCode, setSelectedPlanCode] = useState('PROFESSIONAL');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [stateCode, setStateCode] = useState('UP');
  const [couponCode, setCouponCode] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [refundReason, setRefundReason] = useState('');

  const loadBilling = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [planList, billingData, limit] = await Promise.all([
        financeStore.getPlans(),
        financeStore.getMyBillingData(user.profile.id),
        financeStore.getEffectiveListingLimit(user.profile.id),
      ]);
      setPlans(planList);
      setSubscriptions(billingData.subscriptions);
      setPayments(billingData.payments);
      setInvoices(billingData.invoices);
      setRefunds(billingData.refunds);
      setListingLimit(limit);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  useEffect(() => {
    let active = true;
    void financeStore
      .previewPlanCheckout({
        planCode: selectedPlanCode,
        billingCycle,
        customerStateCode: stateCode,
        couponCode: couponCode.trim() || undefined,
      })
      .then((q) => {
        if (active) {
          setQuote(q);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to calculate quote.');
      });
    return () => {
      active = false;
    };
  }, [selectedPlanCode, billingCycle, stateCode, couponCode]);

  if (!user) return null;
  if (loading) return <LoadingState label="Loading Subscriptions, Payments & GST Invoices..." />;

  const handleSandboxPay = async (simulateFail = false) => {
    setError(null);
    setNotice(null);
    try {
      const { payment } = await financeStore.createSandboxOrder(user, {
        planCode: selectedPlanCode,
        billingCycle,
        customerStateCode: stateCode,
        couponCode: couponCode.trim() || undefined,
        idempotencyKey: `idem_${user.profile.id}_${Date.now()}`,
        consentConfirmed: consentChecked,
      });

      if (simulateFail && payment.total_amount_inr > 0) {
        await financeStore.simulatePaymentFailure(payment.razorpay_order_id, 'Simulated bank decline (Sandbox)');
        setError('Simulated Razorpay payment failure recorded. Subscription was NOT activated.');
      } else if (payment.total_amount_inr > 0) {
        const fakePayId = `pay_sbx_${Date.now()}`;
        const sig = await financeStore.generateSandboxValidSignature(payment.razorpay_order_id, fakePayId);
        const res = await financeStore.verifyRazorpayPayment(user, {
          razorpay_order_id: payment.razorpay_order_id,
          razorpay_payment_id: fakePayId,
          razorpay_signature: sig,
        });
        setNotice(`Payment verified! Plan "${res.subscription?.plan_name}" activated. GST Invoice ${res.invoice?.invoice_number} issued.`);
      } else {
        setNotice('Free tier activated.');
      }
      await loadBilling();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed.');
    }
  };

  const activeSub = subscriptions.find((s) => s.status === 'ACTIVE') ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-950 px-6 py-5 text-white">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-saffron-500">
            Phase 5 · Subscriptions, Razorpay Sandbox &amp; GST Invoices
          </span>
          <h1 className="text-2xl font-extrabold">Billing &amp; Subscription Entitlements</h1>
        </div>
        <div className="text-right text-xs">
          <p className="text-brand-200">Active Plan: <strong>{activeSub?.plan_name ?? 'Free'}</strong></p>
          <p className="text-brand-100">Effective Listing Limit: <strong>{listingLimit}</strong></p>
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {notice ? <SuccessBanner message={notice} /> : null}

      {/* Checkout & Pre-Payment Charge Transparency */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7">
          <div className="flex items-center gap-2 text-brand-700">
            <CreditCard className="h-5 w-5" />
            <h2 className="text-lg font-bold text-slate-900">Upgrade or Renew Plan (Razorpay Sandbox)</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Subscription Plan</label>
              <select
                value={selectedPlanCode}
                onChange={(e) => setSelectedPlanCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.code}>
                    {p.name} — ₹{p.monthly_price_inr}/mo ({p.listing_limit} listings)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Billing Cycle</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="MONTHLY">Monthly (30 Days)</option>
                <option value="ANNUAL">Annual (365 Days)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Customer State Code (GST)</label>
              <select
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="UP">UP — Uttar Pradesh (CGST + SGST)</option>
                <option value="KL">KL — Kerala (IGST)</option>
                <option value="KA">KA — Karnataka (IGST)</option>
                <option value="MH">MH — Maharashtra (IGST)</option>
                <option value="DL">DL — Delhi (IGST)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Promo Coupon (Try LAUNCH20)</label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="LAUNCH20"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I have reviewed the base charge, applicable Indian GST, and one-time billing terms. I understand no automatic recurring debit is enabled without my explicit authorisation.
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleSandboxPay(false)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Pay &amp; Verify (Sandbox Success)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSandboxPay(true)}
              className="rounded-lg border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              Simulate Failed Payment
            </button>
          </div>
        </div>

        {/* Charge & GST Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5">
          <h3 className="text-base font-bold text-slate-900">Pre-Checkout Charge &amp; GST Summary</h3>
          {quote ? (
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>{quote.plan.name} ({quote.billingCycle})</span>
                <span>₹{quote.baseAmountInr.toFixed(2)}</span>
              </div>
              {quote.discountAmountInr > 0 ? (
                <div className="flex justify-between text-emerald-700">
                  <span>Coupon ({quote.appliedCouponCode})</span>
                  <span>-₹{quote.discountAmountInr.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-slate-100 pt-2 text-slate-700">
                <span>Taxable Value</span>
                <span>₹{quote.taxableAmountInr.toFixed(2)}</span>
              </div>
              {quote.taxType === 'INTRA_STATE' ? (
                <>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>CGST (9%)</span>
                    <span>₹{quote.cgstInr.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>SGST (9%)</span>
                    <span>₹{quote.sgstInr.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>IGST (18%)</span>
                  <span>₹{quote.igstInr.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-extrabold text-slate-900">
                <span>Total Payable</span>
                <span>₹{quote.totalAmountInr.toFixed(2)}</span>
              </div>
              <p className="pt-2 text-[11px] text-slate-500">
                No card numbers are collected or stored by SHALOM CONNECTHUB INDIA.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {/* Invoices & Payments History */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-brand-700">
            <FileText className="h-5 w-5" />
            <h2 className="text-lg font-bold text-slate-900">GST Tax Invoices ({invoices.length})</h2>
          </div>
          <div className="mt-4 space-y-3 text-xs">
            {invoices.map((inv) => (
              <div key={inv.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{inv.invoice_number}</span>
                  <StatusBadge status={inv.status} />
                </div>
                <p className="mt-1 text-slate-600">
                  Taxable: ₹{inv.taxable_amount_inr.toFixed(2)} ·{' '}
                  {inv.tax_type === 'INTRA_STATE'
                    ? `CGST ₹${inv.cgst_inr.toFixed(2)} + SGST ₹${inv.sgst_inr.toFixed(2)}`
                    : `IGST ₹${inv.igst_inr.toFixed(2)}`}{' '}
                  · Total: <strong>₹{inv.total_amount_inr.toFixed(2)}</strong>
                </p>
                <p className="mt-1 text-[11px] text-slate-500">{inv.amount_in_words}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-brand-700">
            <RefreshCw className="h-5 w-5" />
            <h2 className="text-lg font-bold text-slate-900">Payment History &amp; Refunds ({payments.length})</h2>
          </div>
          <div className="mt-4 space-y-3 text-xs">
            {payments.map((pay) => (
              <div key={pay.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    ₹{pay.total_amount_inr.toFixed(2)} ({pay.plan_code ?? pay.purpose})
                  </span>
                  <StatusBadge status={pay.status} />
                </div>
                <p className="mt-1 text-slate-500">Order: {pay.razorpay_order_id}</p>
                {pay.failure_reason ? <p className="mt-1 text-red-700">{pay.failure_reason}</p> : null}
                {pay.status === 'SUCCEEDED' && pay.total_amount_inr > 0 ? (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Refund reason..."
                      className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        await financeStore.requestRefund(user, pay.id, refundReason || 'Customer requested refund');
                        setRefundReason('');
                        setNotice('Refund request submitted to Admin Finance.');
                        await loadBilling();
                      }}
                      className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium hover:bg-slate-50"
                    >
                      Request Refund
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          {refunds.length > 0 ? (
            <div className="mt-4 border-t border-slate-100 pt-3 text-xs">
              <p className="font-bold text-slate-800">My Refund Requests ({refunds.length})</p>
              {refunds.map((r) => (
                <div key={r.id} className="mt-1.5 flex items-center justify-between">
                  <span>₹{r.amount_inr.toFixed(2)} — {r.reason}</span>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      {activeSub ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>
            Active Subscription: <strong>{activeSub.plan_name}</strong> · Expires{' '}
            {activeSub.expires_at ? new Date(activeSub.expires_at).toLocaleDateString('en-IN') : 'Never'}
          </span>
        </div>
      ) : null}
    </div>
  );
}
