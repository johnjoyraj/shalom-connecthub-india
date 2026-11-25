import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { platformStore } from '../../services/platformStore';
import type { PricingTier } from '../../types/domain';

export function PricingPage() {
  const [tiers, setTiers] = useState<PricingTier[]>([]);

  useEffect(() => {
    void platformStore.getPricingTiers().then(setTiers);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          Administrator-Configurable Subscription Engine
        </span>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Simple, Transparent Plans Across India
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
          Start free with 1 eligible listing, or upgrade as your hiring, property portfolio, or school admissions grow.
          Online payments and GST invoices via Razorpay activate in Phase 5.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-5">
        {tiers.map((tier) => (
          <div
            key={tier.code}
            className={`flex flex-col justify-between rounded-2xl border p-6 shadow-sm ${
              tier.highlight
                ? 'border-brand-600 bg-brand-950 text-white ring-2 ring-brand-600'
                : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{tier.name}</h2>
                {tier.highlight ? (
                  <span className="rounded-full bg-saffron-500 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-950">
                    Popular
                  </span>
                ) : null}
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold">₹{tier.monthly_inr.toLocaleString('en-IN')}</span>
                <span className={`text-xs ${tier.highlight ? 'text-brand-200' : 'text-slate-500'}`}>/ month</span>
              </div>
              <p className={`mt-1 text-xs font-medium ${tier.highlight ? 'text-brand-200' : 'text-slate-600'}`}>
                Up to {tier.active_listings_limit} active listing{tier.active_listings_limit > 1 ? 's' : ''}
              </p>
              <ul className="mt-5 space-y-2.5 text-xs">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${tier.highlight ? 'text-saffron-500' : 'text-emerald-600'}`} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/register"
              className={`mt-6 block rounded-lg px-4 py-2 text-center text-sm font-semibold transition ${
                tier.highlight
                  ? 'bg-white text-brand-900 hover:bg-brand-50'
                  : 'bg-brand-700 text-white hover:bg-brand-800'
              }`}
            >
              {tier.monthly_inr === 0 ? 'Start Free' : 'Choose Plan'}
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-slate-200 bg-white p-5 text-xs text-slate-600">
        <strong>Pricing &amp; Consent Policy:</strong> Applicable GST, service charges, or facilitation fees are always shown clearly before payment.
        No automatic recurring debits occur without explicit customer authorisation.
      </div>
    </div>
  );
}
