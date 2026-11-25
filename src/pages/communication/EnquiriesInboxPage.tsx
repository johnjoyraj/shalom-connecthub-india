import { Bell, CheckCircle2, MessageSquare, Star } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ErrorBanner, LoadingState, SuccessBanner } from '../../components/common/StateViews';
import { useAuth } from '../../context/AuthContext';
import { communicationStore } from '../../services/communicationStore';
import { platformStore } from '../../services/platformStore';
import type { CommonEnquiry, CommonEnquiryStatus, UserNotificationPreferences } from '../../types/communication';
import type { Listing } from '../../types/domain';

export function EnquiriesInboxPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [enquiries, setEnquiries] = useState<CommonEnquiry[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [prefs, setPrefs] = useState<UserNotificationPreferences>({ email: true, whatsapp: false, push: false });

  const [listingId, setListingId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [myEnqs, approvedListings, myPrefs] = await Promise.all([
        communicationStore.getMyEnquiries(user),
        platformStore.searchListings({}),
        communicationStore.getPreferences(user.profile.id),
      ]);
      setEnquiries(myEnqs);
      setListings(approvedListings);
      setPrefs(myPrefs);
      if (approvedListings.length > 0 && !listingId) {
        setListingId(approvedListings[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [user, listingId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (!user) return null;
  if (loading) return <LoadingState label="Loading Enquiries & Notification Preferences..." />;

  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      await communicationStore.submitCommonEnquiry(user, { listingId, subject, message });
      setSubject('');
      setMessage('');
      setNotice('Enquiry submitted and listing owner notified per consent settings.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit enquiry.');
    }
  };

  const handleSavePrefs = async (next: UserNotificationPreferences) => {
    setPrefs(next);
    await communicationStore.updatePreferences(user.profile.id, next);
    setNotice('Notification consent preferences saved.');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Common Enquiry Inbox &amp; Preferences</h1>
          <p className="text-sm text-slate-600">
            Track enquiries across Staff Connect, Property Connect, and School Connect.
          </p>
        </div>
        <Link to="/dashboard/messages" className="rounded-lg bg-brand-700 px-4 py-2 text-xs font-semibold text-white">
          Open Conversations →
        </Link>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {notice ? <SuccessBanner message={notice} /> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <form onSubmit={handleCreateEnquiry} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7">
          <div className="flex items-center gap-2 text-brand-700">
            <MessageSquare className="h-5 w-5" />
            <h2 className="text-lg font-bold text-slate-900">Submit New Listing Enquiry</h2>
          </div>
          <select
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {listings.map((l) => (
              <option key={l.id} value={l.id}>[{l.module_key.toUpperCase()}] {l.title}</option>
            ))}
          </select>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enquiry Subject"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <textarea
            rows={3}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your enquiry..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
            Send Enquiry
          </button>
        </form>

        {/* Consent-Controlled Notification Channels */}
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5">
          <div className="flex items-center gap-2 text-brand-700">
            <Bell className="h-5 w-5" />
            <h2 className="text-lg font-bold text-slate-900">Notification Consent (DPDPA)</h2>
          </div>
          <p className="text-xs text-slate-500">
            We only dispatch WhatsApp, Email, or Push messages when your explicit consent is enabled.
          </p>
          <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
            <span>Transactional &amp; Enquiry Emails</span>
            <input
              type="checkbox"
              checked={prefs.email}
              onChange={(e) => void handleSavePrefs({ ...prefs, email: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
            <span>Official WhatsApp Business Alerts</span>
            <input
              type="checkbox"
              checked={prefs.whatsapp}
              onChange={(e) => void handleSavePrefs({ ...prefs, whatsapp: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
            <span>Push Notifications (FCM)</span>
            <input
              type="checkbox"
              checked={prefs.push}
              onChange={(e) => void handleSavePrefs({ ...prefs, push: e.target.checked })}
            />
          </label>
        </div>
      </div>

      {/* Enquiries List */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">My Enquiries ({enquiries.length})</h2>
        <div className="mt-4 space-y-3">
          {enquiries.map((enq) => {
            const isOwner = enq.owner_id === user.profile.id;
            return (
              <div key={enq.id} className="rounded-xl border border-slate-200 p-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900">{enq.subject}</span>
                    <span className="ml-2 text-slate-500">({enq.module_key})</span>
                  </div>
                  <StatusBadge status={enq.status} />
                </div>
                <p className="mt-1 text-slate-500">
                  Listing: {enq.listing_title} · Customer: {enq.customer_name}
                </p>
                <p className="mt-1.5 text-slate-700">{enq.message}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(isOwner
                    ? (['VIEWED', 'CONTACTED', 'ACCEPTED', 'COMPLETED', 'REJECTED', 'CLOSED'] as CommonEnquiryStatus[])
                    : (['CANCELLED', 'CLOSED'] as CommonEnquiryStatus[])
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={async () => {
                        await communicationStore.updateEnquiryStatus(user, enq.id, st);
                        setNotice(`Enquiry updated to ${st}.`);
                        await loadData();
                      }}
                      className="rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] font-medium hover:bg-slate-50"
                    >
                      {st}
                    </button>
                  ))}
                  {!isOwner && !enq.feedback_rating ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await communicationStore.submitEnquiryFeedback(user, enq.id, 5, 'Helpful response');
                        setNotice('Thank you for your feedback!');
                        await loadData();
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
                    >
                      <Star className="h-3 w-3" /> Rate 5★
                    </button>
                  ) : enq.feedback_rating ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Rated {enq.feedback_rating}/5
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
