import { AlertTriangle, CheckCircle2, Inbox, Loader2 } from 'lucide-react';

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-600" role="status" aria-live="polite">
      <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
      <span>{message}</span>
    </div>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <Inbox className="h-10 w-10 text-slate-400" />
      <h3 className="mt-3 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-600">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
