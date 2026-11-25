import { Bot, ShieldAlert } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ErrorBanner, LoadingState, SuccessBanner } from '../../components/common/StateViews';
import { useAuth } from '../../context/AuthContext';
import { aiService } from '../../services/aiService';
import type { AiFeatureKey, AiModerationFlag, AiSettings, AiUsageLog } from '../../types/ai';

export function AdminAiControlPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [usageLogs, setUsageLogs] = useState<AiUsageLog[]>([]);
  const [flags, setFlags] = useState<AiModerationFlag[]>([]);
  const [monthlySpent, setMonthlySpent] = useState(0);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const ov = await aiService.getAdminOverview(user);
      setSettings(ov.settings);
      setUsageLogs(ov.usageLogs);
      setFlags(ov.moderationFlags);
      setMonthlySpent(ov.monthlySpentInr);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load AI controls.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (!user) return null;
  if (loading || !settings) return <LoadingState label="Loading AI Governance & Spend Controls..." />;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 px-6 py-5 text-white">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-saffron-500" />
          <div>
            <h1 className="text-2xl font-extrabold">AI Governance, Feature Toggles &amp; Spend Caps</h1>
            <p className="text-xs text-slate-300">
              Monthly Spend: ₹{monthlySpent.toFixed(2)} / Cap: ₹{settings.monthly_budget_cap_inr.toFixed(2)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            await aiService.updateSettings(user, { is_enabled: !settings.is_enabled });
            setNotice(`Master AI switch set to ${!settings.is_enabled ? 'ENABLED' : 'DISABLED'}.`);
            await loadData();
          }}
          className="rounded-lg bg-saffron-500 px-4 py-2 text-xs font-bold text-slate-950"
        >
          {settings.is_enabled ? 'AI Master: ON' : 'AI Master: OFF'}
        </button>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {notice ? <SuccessBanner message={notice} /> : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Configurable AI Capabilities</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(settings.enabled_features) as AiFeatureKey[]).map((key) => (
            <div key={key} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs">
              <span className="font-semibold text-slate-800">{key.replace('_', ' ')}</span>
              <button
                type="button"
                onClick={async () => {
                  await aiService.updateSettings(user, {
                    enabled_features: {
                      ...settings.enabled_features,
                      [key]: !settings.enabled_features[key],
                    },
                  });
                  await loadData();
                }}
                className={`rounded-lg px-2.5 py-1 font-semibold ${
                  settings.enabled_features[key] ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {settings.enabled_features[key] ? 'ON' : 'OFF'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-amber-700">
          <ShieldAlert className="h-5 w-5" />
          <h2 className="text-lg font-bold text-slate-900">AI Moderation Flags ({flags.length})</h2>
        </div>
        <div className="mt-3 space-y-2 text-xs">
          {flags.map((f) => (
            <div key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3">
              <div>
                <p className="font-bold text-slate-900">{f.subject_text} ({f.severity})</p>
                <p className="text-slate-600">{f.flag_reasons.join('; ')}</p>
              </div>
              <StatusBadge status={f.status} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Recent AI API Usage Logs ({usageLogs.length})</h2>
        <div className="mt-3 space-y-2 text-xs">
          {usageLogs.slice(0, 15).map((l) => (
            <div key={l.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <span><strong>{l.feature_key}</strong> · {l.tokens_used} tokens · ₹{l.estimated_cost_inr.toFixed(4)}</span>
              <StatusBadge status={l.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
