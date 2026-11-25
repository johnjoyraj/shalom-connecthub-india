const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  PENDING_REVIEW: 'bg-amber-50 text-amber-800 border-amber-200',
  OPEN: 'bg-amber-50 text-amber-800 border-amber-200',
  IN_REVIEW: 'bg-blue-50 text-blue-700 border-blue-200',
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  PENDING_DELETION: 'bg-red-50 text-red-700 border-red-200',
  EXPIRED: 'bg-slate-100 text-slate-600 border-slate-200',
  DISMISSED: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
