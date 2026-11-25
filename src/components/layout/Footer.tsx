import { Link } from 'react-router-dom';
import { BRAND_INFO } from '../../data/platformDefaults';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <h2 className="text-sm font-bold tracking-wide text-white">{BRAND_INFO.name}</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">{BRAND_INFO.vision}</p>
          <p className="mt-3 text-xs text-slate-400">
            Grievance Desk:{' '}
            <a href={`mailto:${BRAND_INFO.grievanceEmail}`} className="text-brand-300 underline">
              {BRAND_INFO.grievanceEmail}
            </a>
          </p>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Marketplace</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/staff" className="hover:text-white">Staff Connect &amp; Jobs</Link></li>
            <li><Link to="/properties" className="hover:text-white">Property Connect</Link></li>
            <li><Link to="/schools" className="hover:text-white">School Connect</Link></li>
            <li><Link to="/providers" className="hover:text-white">Service Providers</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Platform</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/pricing" className="hover:text-white">Subscription Plans</Link></li>
            <li><Link to="/about" className="hover:text-white">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact &amp; Support</Link></li>
            <li><Link to="/help" className="hover:text-white">Help Centre</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Legal &amp; Compliance (India)</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
            <li><Link to="/privacy" className="hover:text-white">Privacy Policy (DPDPA)</Link></li>
            <li><Link to="/dashboard/settings" className="hover:text-white">Consent &amp; Account Deletion</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 px-4 py-4 text-center text-xs text-slate-500">
        © 2026 SHALOM CONNECTHUB INDIA. Platform intermediaries do not guarantee property legal titles or candidate qualifications without statutory verification.
      </div>
    </footer>
  );
}
