import { Bell, Play, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ErrorBanner, LoadingState, SuccessBanner } from '../../components/common/StateViews';
import { useAuth } from '../../context/AuthContext';
import { communicationStore } from '../../services/communicationStore';
import type { AutomationJob, CommonEnquiry, NotificationLog, NotificationTemplate } from '../../types/communication';

export function AdminNotificationsPage({ mode = 'notifications' }: { mode?: 'notifications' | 'enquiries' }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [jobs, setJobs] = useState<AutomationJob[]>([]);
  const [enquiries, setEnquiries] = useState<CommonEnquiry[]>([]);

  const loadOverview = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await communicationStore.adminGetNotificationOverview(user);
      setTemplates(data.templates);
      setLogs(data.logs);
      setJobs(data.jobs);
      setEnquiries(data.enquiries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load notification overview.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  if (!user) return null;
  if (loading) return <LoadingState label="Loading Notification & Automation Logs..." />;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 px-6 py-5 text-white">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-saffron-500">
            Phase 6 · Official WhatsApp Cloud, Email &amp; Push Automation
          </span>
          <h1 className="text-2xl font-extrabold">
            {mode === 'enquiries' ? 'Platform Enquiries Oversight' : 'Notification Templates, Delivery Logs & Queue'}
          </h1>
        </div>
        <button
          type="button"
          onClick={async () => {
            const res = await communicationStore.runAutomationSweep();
            setNotice(
              `Automation sweep: ${res.unansweredEnquiriesQueued} unanswered queued, ${res.jobsCompleted} completed, ${res.jobsRetrying} retrying.`
            );
            await loadOverview();
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-saffron-500 px-4 py-2 text-xs font-bold text-slate-950"
        >
          <Play className="h-4 w-4" />
          <span>Run Automation Worker Sweep</span>
        </button>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {notice ? <SuccessBanner message={notice} /> : null}

      {mode === 'enquiries' ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">All Marketplace Enquiries ({enquiries.length})</h2>
          <div className="mt-4 space-y-3 text-xs">
            {enquiries.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-4">
                <div>
                  <p className="font-bold text-slate-900">{e.subject} ({e.module_key})</p>
                  <p className="text-slate-500">{e.customer_name} → {e.listing_title}</p>
                </div>
                <StatusBadge status={e.status} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-brand-700">
              <Bell className="h-5 w-5" />
              <h2 className="text-lg font-bold text-slate-900">Notification Templates ({templates.length})</h2>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {templates.map((t) => (
                <div key={t.id} className="rounded-xl border border-slate-200 p-4 text-xs">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{t.template_key}</span>
                    <span className="rounded bg-brand-50 px-2 py-0.5 text-[10px] text-brand-700">{t.channel}</span>
                  </div>
                  <p className="mt-1 text-slate-600">{t.body_template}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-brand-700">
              <ShieldCheck className="h-5 w-5" />
              <h2 className="text-lg font-bold text-slate-900">Delivery &amp; Consent Logs ({logs.length})</h2>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              {logs.map((l) => (
                <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3">
                  <div>
                    <p className="font-bold text-slate-900">{l.channel} · {l.provider}</p>
                    <p className="text-slate-500">{l.error_message || `Delivered ID: ${l.provider_message_id ?? 'N/A'}`}</p>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Automation Jobs Queue ({jobs.length})</h2>
            <div className="mt-3 space-y-2 text-xs">
              {jobs.map((j) => (
                <div key={j.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                  <div>
                    <p className="font-bold text-slate-900">{j.job_type}</p>
                    <p className="text-slate-500">Attempts: {j.attempts}/{j.max_attempts} {j.last_error ? `· ${j.last_error}` : ''}</p>
                  </div>
                  <StatusBadge status={j.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
