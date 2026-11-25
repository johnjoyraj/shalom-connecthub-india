import { Calendar, Flag, IndianRupee, MapPin, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState, ErrorBanner, LoadingState, SuccessBanner } from '../../components/common/StateViews';
import { useAuth } from '../../context/AuthContext';
import { AREA_UNIT_LABELS, PROPERTY_TYPE_LABELS } from '../../services/propertyFormRules';
import { getDisplayAddress, NON_LEGAL_TITLE_DISCLAIMER, propertyStore } from '../../services/propertyStore';
import type { PropertyEnquiryType, PropertyListing } from '../../types/property';

export function PropertyDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [enquiryType, setEnquiryType] = useState<PropertyEnquiryType>('VISIT_REQUEST');
  const [visitDate, setVisitDate] = useState('');
  const [message, setMessage] = useState('');

  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    void propertyStore.getPropertyBySlug(slug).then((found) => {
      setProperty(found);
      if (found) {
        setEnquiryType(found.purpose === 'SALE' ? 'BUYER' : 'TENANT');
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <LoadingState label="Loading property details..." />;
  if (!property) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          title="Listing Not Found"
          description="This property listing may have expired or been removed."
          action={<Link to="/properties" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">Browse Properties</Link>}
        />
      </div>
    );
  }

  const handleEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await propertyStore.submitPropertyEnquiry(user, {
        propertyId: property.id,
        enquiryType,
        preferredVisitDate: enquiryType === 'VISIT_REQUEST' ? visitDate : undefined,
        message,
      });
      setMessage('');
      setNotice('Your enquiry / visit request has been sent to the property lister.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send enquiry.');
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setError(null);
    try {
      await propertyStore.reportProperty(user, property.id, reportReason, reportDetails);
      setShowReport(false);
      setReportReason('');
      setReportDetails('');
      setNotice('Property report submitted to the Moderation Queue.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit report.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6">
      {error ? <ErrorBanner message={error} /> : null}
      {notice ? <SuccessBanner message={notice} /> : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
            {PROPERTY_TYPE_LABELS[property.property_type]} · {property.purpose}
          </span>
          <button
            type="button"
            onClick={() => setShowReport((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Flag className="h-3.5 w-3.5 text-red-600" />
            <span>Report Property</span>
          </button>
        </div>

        <h1 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">{property.title}</h1>
        <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <span>{getDisplayAddress(property, user)}</span>
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">{property.purpose === 'SALE' ? 'Sale Price' : 'Monthly Rent'}</p>
            <p className="mt-0.5 flex items-center gap-1 text-lg font-extrabold text-emerald-700">
              <IndianRupee className="h-4 w-4" />
              {(property.purpose === 'SALE' ? property.sale_price ?? 0 : property.monthly_rent ?? 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Area</p>
            <p className="mt-0.5 text-base font-bold text-slate-900">
              {property.area_value} {AREA_UNIT_LABELS[property.area_unit]}
            </p>
          </div>
          {property.bedrooms !== null ? (
            <div>
              <p className="text-xs text-slate-500">Configuration</p>
              <p className="mt-0.5 text-base font-bold text-slate-900">
                {property.bedrooms} Bed / {property.bathrooms ?? 0} Bath
              </p>
            </div>
          ) : null}
          {property.security_deposit ? (
            <div>
              <p className="text-xs text-slate-500">Security Deposit</p>
              <p className="mt-0.5 text-base font-bold text-slate-900">
                ₹{property.security_deposit.toLocaleString('en-IN')}
              </p>
            </div>
          ) : null}
        </div>

        <p className="mt-5 text-sm leading-relaxed text-slate-700">{property.description}</p>

        {property.amenities.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {property.amenities.map((am) => (
              <span key={am} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800">
                {am}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <span>{NON_LEGAL_TITLE_DISCLAIMER}</span>
          </div>
        </div>
      </div>

      {showReport ? (
        <form onSubmit={handleReport} className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
          <h2 className="text-base font-bold text-red-900">Report Fraudulent or Misleading Listing</h2>
          <div className="mt-3 space-y-3">
            <input
              type="text"
              required
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Reason (e.g. Incorrect price, suspected duplicate, unauthorised agent)"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <textarea
              rows={2}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Additional details for moderation team..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white">
              Submit Report
            </button>
          </div>
        </form>
      ) : null}

      <form onSubmit={handleEnquiry} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Send Buyer / Tenant Enquiry or Visit Request</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            value={enquiryType}
            onChange={(e) => setEnquiryType(e.target.value as PropertyEnquiryType)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="VISIT_REQUEST">Request Site / Property Visit</option>
            <option value="TENANT">Tenant / Rental Enquiry</option>
            <option value="BUYER">Buyer / Purchase Enquiry</option>
          </select>
          {enquiryType === 'VISIT_REQUEST' ? (
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
              />
            </div>
          ) : null}
        </div>
        <textarea
          rows={3}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share your requirements, preferred move-in date, or visit timing..."
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="mt-3 rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800">
          Send Enquiry
        </button>
      </form>
    </div>
  );
}
