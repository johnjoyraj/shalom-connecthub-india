import { Bell, CreditCard, DollarSign, FileText, RefreshCw, Sliders } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ErrorBanner, LoadingState, SuccessBanner } from '../../components/common/StateViews';
import { useAuth } from '../../context/AuthContext';
import { financeStore } from '../../services/financeStore';
import type {
  CommissionRule,
  InvoiceRecord,
  PaymentRecord,
  RefundRecord,
  ServiceChargeRule,
  SubscriptionPlan,
  SubscriptionRecord,
} from '../../types/finance';

export type AdminFinanceTab = 'plans' | 'subscriptions' | 'payments' | 'refunds' | 'commissions' | 'reports';

export function AdminFinancePage({ tab }: { tab: AdminFinanceTab }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [serviceCharges, setServiceCharges] = useState<ServiceChargeRule[]>([]);
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);

  const loadFinance = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await financeStore.adminGetFinanceOverview(user);
      setPlans(data.plans);
      setSubscriptions(data.subscriptions);
      setPayments(data.payments);
      setInvoices(data.invoices);
      setRefunds(data.refunds);
      setServiceCharges(data.serviceCharges);
      setCommissionRules(data.commissionRules);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Admin Finance.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadFinance();
  }, [loadFinance]);

  if (!user) return null;

  const totalRevenue = payments
    .filter((p) => p.status === 'SUCCEEDED')
    .reduce((acc, p) => acc + p.total_amount_inr, 0);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'
    }`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 px-6 py-5 text-white">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-saffron-500">
            Admin Finance Control Centre
          </span>
          <h1 className="text-2xl font-extrabold">Plans, Razorpay Payments, Refunds &amp; Commissions</h1>
        </div>
        <button
          type="button"
          onClick={async () => {
            const res = await financeStore.runSubscriptionExpirySweep();
            setNotice(`Expiry sweep completed: ${res.remindersSent} reminder(s), ${res.expiredCount} expired.`);
            await loadFinance();
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-saffron-500 px-4 py-2 text-xs font-bold text-slate-950"
        >
          <Bell className="h-4 w-4" />
          <span>Run Expiry Reminder Sweep</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <nav className="space-y-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <NavLink to="/admin/plans" className={navClass}><Sliders className="h-4 w-4" /> Configurable Plans</NavLink>
            <NavLink to="/admin/subscriptions" className={navClass}><RefreshCw className="h-4 w-4" /> Subscriptions ({subscriptions.length})</NavLink>
            <NavLink to="/admin/payments" className={navClass}><CreditCard className="h-4 w-4" /> Payments &amp; Invoices</NavLink>
            <NavLink to="/admin/refunds" className={navClass}><DollarSign className="h-4 w-4" /> Refunds ({refunds.length})</NavLink>
            <NavLink to="/admin/commissions" className={navClass}><FileText className="h-4 w-4" /> Charges &amp; Commissions</NavLink>
            <NavLink to="/admin/reports" className={navClass}><FileText className="h-4 w-4" /> Revenue Summary</NavLink>
          </nav>
        </aside>

        <div className="space-y-6 lg:col-span-9">
          {error ? <ErrorBanner message={error} /> : null}
          {notice ? <SuccessBanner message={notice} /> : null}

          {loading ? (
            <LoadingState label="Loading Admin Finance Data..." />
          ) : tab === 'plans' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Configurable Subscription Plans</h2>
              <div className="mt-4 space-y-3">
                {plans.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 text-sm">
                    <div>
                      <p className="font-bold text-slate-900">{p.name} ({p.code})</p>
                      <p className="text-xs text-slate-500">
                        ₹{p.monthly_price_inr}/mo · ₹{p.annual_price_inr}/yr · {p.listing_limit} listings · {p.user_limit} users
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await financeStore.adminUpdatePlan(user, p.id, { listing_limit: p.listing_limit + 1 });
                          setNotice(`Increased ${p.name} listing limit to ${p.listing_limit + 1}.`);
                          await loadFinance();
                        }}
                        className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium"
                      >
                        +1 Listing Limit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await financeStore.adminUpdatePlan(user, p.id, { is_active: !p.is_active });
                          setNotice(`${p.name} plan ${!p.is_active ? 'enabled' : 'disabled'}.`);
                          await loadFinance();
                        }}
                        className="rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
                      >
                        {p.is_active ? 'Active' : 'Disabled'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : tab === 'refunds' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Refund Requests ({refunds.length})</h2>
              <div className="mt-4 space-y-3 text-xs">
                {refunds.map((ref) => (
                  <div key={ref.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-4">
                    <div>
                      <p className="font-bold text-slate-900">₹{ref.amount_inr.toFixed(2)} — {ref.reason}</p>
                      <p className="text-slate-500">Payment: {ref.payment_id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={ref.status} />
                      {ref.status === 'REQUESTED' ? (
                        <>
                          <button
                            type="button"
                            onClick={async () => {
                              await financeStore.adminProcessRefund(user, ref.id, 'PROCESSED');
                              setNotice('Refund processed and invoice marked REFUNDED.');
                              await loadFinance();
                            }}
                            className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                          >
                            Approve Refund
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await financeStore.adminProcessRefund(user, ref.id, 'REJECTED');
                              await loadFinance();
                            }}
                            className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-700"
                          >
                            Reject
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : tab === 'commissions' ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Service Charges ({serviceCharges.length})</h2>
                <div className="mt-3 space-y-2 text-xs">
                  {serviceCharges.map((sc) => (
                    <div key={sc.id} className="rounded-xl border border-slate-200 p-3">
                      <p className="font-bold text-slate-900">{sc.service_type} ({sc.module_key}) — ₹{sc.amount_or_rate}</p>
                      <p className="text-slate-500">{sc.terms_and_conditions}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Contract-Gated Commission Rules ({commissionRules.length})</h2>
                <div className="mt-3 space-y-2 text-xs">
                  {commissionRules.map((cr) => (
                    <div key={cr.id} className="rounded-xl border border-slate-200 p-3">
                      <p className="font-bold text-slate-900">{cr.service_type} ({cr.module_key}) — {cr.rate_or_amount}%</p>
                      <p className="text-slate-500">{cr.terms_and_conditions}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Financial &amp; Payments Summary</h2>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Verified Gross Revenue</p>
                  <p className="mt-1 text-2xl font-extrabold text-emerald-700">₹{totalRevenue.toFixed(2)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Total Payments</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">{payments.length}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">GST Invoices Issued</p>
                  <p className="mt-1 text-2xl font-extrabold text-brand-700">{invoices.length}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
