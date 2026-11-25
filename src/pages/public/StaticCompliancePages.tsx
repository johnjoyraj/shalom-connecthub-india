import { ArrowRight, Mail, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { BRAND_INFO } from '../../data/platformDefaults';

export function ModulePreviewPage({
  moduleTitle,
  phaseNumber,
  summary,
  highlights,
}: {
  moduleTitle: string;
  phaseNumber: number;
  summary: string;
  highlights: string[];
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          Scheduled for Phase {phaseNumber}
        </span>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900">{moduleTitle}</h1>
        <p className="mt-2 text-sm text-slate-600">{summary}</p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {highlights.map((item) => (
            <div key={item} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-800">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            <span>Create Unified Account Now</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to All-India Search
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ListingDetailShellPage() {
  const { slug } = useParams();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          Listing Slug: {slug}
        </span>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Marketplace Listing Detail Shell</h1>
        <p className="mt-2 text-sm text-slate-600">
          Phase 1 establishes the unified listing schema, moderation approval gate, and privacy-controlled visibility.
          Category-specific fields, media galleries, and the common enquiry workflow will populate here in Phases 2–6.
        </p>
        <div className="mt-6 flex gap-3">
          <Link to="/" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
            Return to Search
          </Link>
          <Link to="/register" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
            Sign Up to Enquire
          </Link>
        </div>
      </div>
    </div>
  );
}

export function InfoCompliancePage({
  title,
  subtitle,
  sections,
}: {
  title: string;
  subtitle: string;
  sections: Array<{ heading: string; body: string }>;
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-extrabold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        <div className="mt-8 space-y-6">
          {sections.map((sec) => (
            <section key={sec.heading}>
              <h2 className="text-lg font-bold text-slate-900">{sec.heading}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{sec.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <strong>Grievance &amp; Compliance Contact:</strong>{' '}
              <a href={`mailto:${BRAND_INFO.grievanceEmail}`} className="underline">
                {BRAND_INFO.grievanceEmail}
              </a>{' '}
              · Support:{' '}
              <a href={`mailto:${BRAND_INFO.supportEmail}`} className="underline">
                {BRAND_INFO.supportEmail}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContactPage() {
  return (
    <InfoCompliancePage
      title="Contact & Grievance Redressal"
      subtitle="Reach SHALOM CONNECTHUB INDIA support or submit a statutory grievance notice."
      sections={[
        {
          heading: 'Platform Support',
          body: `For onboarding, organisation approvals, or technical issues across India, write to ${BRAND_INFO.supportEmail}.`,
        },
        {
          heading: 'Grievance Officer (IT Rules & DPDPA)',
          body: `Statutory complaints, privacy notices, or content takedown requests may be addressed to our Grievance Officer at ${BRAND_INFO.grievanceEmail}. Standard acknowledgement SLA is 48 hours.`,
        },
      ]}
    />
  );
}

export function HelpPage() {
  return (
    <InfoCompliancePage
      title="Help Centre"
      subtitle="Guides for unified accounts, All-India location search, organisations, and privacy."
      sections={[
        {
          heading: 'One Unified Account for All Roles',
          body: 'You never need separate logins for Staff Connect, Property Connect, or School Connect. Enable or switch roles anytime under Dashboard → Settings.',
        },
        {
          heading: 'Account Recovery & Deletion',
          body: 'Use Forgot Password for account recovery, or submit an Account Deletion Request in Dashboard → Settings in accordance with the Digital Personal Data Protection Act (DPDPA).',
        },
      ]}
    />
  );
}

export function TermsPage() {
  return (
    <InfoCompliancePage
      title="Terms of Service"
      subtitle={`Effective Policy Version: ${BRAND_INFO.policyVersion} — Applicable across India.`}
      sections={[
        {
          heading: '1. Marketplace Intermediary Role',
          body: 'SHALOM CONNECTHUB INDIA provides a technology marketplace connecting employers, candidates, property owners/agents, educational institutions, and service providers. Uploaded documents do not constitute legal property title verification or statutory qualification guarantees.',
        },
        {
          heading: '2. Acceptable Use & Moderation',
          body: 'Fraudulent listings, impersonation, spam, or unauthorised scraping are prohibited and subject to suspension with audit logging.',
        },
        {
          heading: '3. Payments, GST & Refunds',
          body: 'All applicable subscription fees, service charges, and taxes are disclosed prior to checkout. No recurring payment is initiated without explicit user authorisation.',
        },
      ]}
    />
  );
}

export function PrivacyPage() {
  return (
    <InfoCompliancePage
      title="Privacy Policy (DPDPA Aligned)"
      subtitle={`Effective Policy Version: ${BRAND_INFO.policyVersion}`}
      sections={[
        {
          heading: '1. Purpose-Limited Collection & PostgreSQL Single Source of Truth',
          body: 'Core user profiles, consent records, and verification metadata are stored securely with strict Row Level Security (RLS). Private documents and payment records are never accessible to unauthorised users.',
        },
        {
          heading: '2. Communication Consent',
          body: 'WhatsApp, email, and push notifications are sent strictly according to your recorded consent preferences, which you may withdraw anytime in Dashboard Settings.',
        },
        {
          heading: '3. Data Retention & Deletion Rights',
          body: 'You may request account deletion from Dashboard Settings. Statutory billing/audit records are retained only as required under Indian tax and IT regulations.',
        },
      ]}
    />
  );
}

export function ContactMailBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
      <Mail className="h-3.5 w-3.5" />
      {BRAND_INFO.supportEmail}
    </span>
  );
}
