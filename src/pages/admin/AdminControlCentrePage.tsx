import {
  Activity,
  Building2,
  ClipboardList,
  Flag,
  Layers,
  MapPin,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ErrorBanner, LoadingState, SuccessBanner } from '../../components/common/StateViews';
import { useAuth } from '../../context/AuthContext';
import { BRAND_INFO } from '../../data/platformDefaults';
import { formatLocationBreadcrumb, isValidIndianPincode } from '../../services/locationSearch';
import { hasAdminScope, ROLE_LABELS } from '../../services/permissions';
import { platformStore } from '../../services/platformStore';
import type {
  AdminScope,
  AuditLogEntry,
  Category,
  FeatureFlag,
  Listing,
  LocationNode,
  ModerationReport,
  Organisation,
  UserRole,
  UserWithRoles,
} from '../../types/domain';

export type AdminTab =
  | 'overview'
  | 'users'
  | 'organisations'
  | 'listings'
  | 'categories'
  | 'locations'
  | 'moderation'
  | 'settings'
  | 'audit-logs'
  | 'finance-shell'
  | 'module-shell';

interface AdminControlCentreProps {
  tab: AdminTab;
  shellTitle?: string;
}

const ALL_ROLES: UserRole[] = [
  'customer',
  'employer',
  'candidate',
  'property_owner',
  'property_agent',
  'school_admin',
  'service_provider',
  'org_member',
  'admin_moderation',
  'admin_finance',
  'admin_system',
  'super_admin',
];

export function AdminControlCentrePage({ tab, shellTitle }: AdminControlCentreProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const [userQuery, setUserQuery] = useState('');
  const [newLocName, setNewLocName] = useState('');
  const [newLocLevel, setNewLocLevel] = useState<LocationNode['level']>('CITY');
  const [newLocState, setNewLocState] = useState('UP');
  const [newLocPin, setNewLocPin] = useState('');

  const loadAdminData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const roles = user.roles;
      const [locs, cats, fFlags, allListings] = await Promise.all([
        platformStore.getLocations(true),
        platformStore.getCategories(true),
        platformStore.getFeatureFlags(),
        platformStore.searchListings({ includeUnapproved: true }),
      ]);
      setLocations(locs);
      setCategories(cats);
      setFlags(fFlags);
      setListings(allListings);

      if (hasAdminScope(roles, 'users')) {
        setUsers(await platformStore.adminListUsers(roles));
      }
      if (hasAdminScope(roles, 'moderation')) {
        const [orgList, reportList] = await Promise.all([
          platformStore.adminListOrganisations(roles),
          platformStore.adminListReports(roles),
        ]);
        setOrgs(orgList);
        setReports(reportList);
      }
      if (hasAdminScope(roles, 'audit')) {
        setAuditLogs(await platformStore.adminListAuditLogs(roles));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin console data.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

  if (!user) return null;

  const navLinks: Array<{ to: string; label: string; scope: AdminScope; icon: React.ReactNode }> = [
    { to: '/admin', label: 'Overview', scope: 'overview', icon: <Activity className="h-4 w-4" /> },
    { to: '/admin/users', label: 'Users & Roles', scope: 'users', icon: <Users className="h-4 w-4" /> },
    { to: '/admin/organisations', label: 'Organisations', scope: 'moderation', icon: <Building2 className="h-4 w-4" /> },
    { to: '/admin/listings', label: 'Listings Queue', scope: 'moderation', icon: <ClipboardList className="h-4 w-4" /> },
    { to: '/admin/categories', label: 'Categories & Modules', scope: 'system', icon: <Layers className="h-4 w-4" /> },
    { to: '/admin/locations', label: 'India Locations', scope: 'system', icon: <MapPin className="h-4 w-4" /> },
    { to: '/admin/moderation', label: 'Moderation Reports', scope: 'moderation', icon: <Flag className="h-4 w-4" /> },
    { to: '/admin/settings', label: 'Flags & Settings', scope: 'system', icon: <Settings className="h-4 w-4" /> },
    { to: '/admin/audit-logs', label: 'Audit Logs', scope: 'audit', icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  const handleToggleSuspend = async (target: UserWithRoles) => {
    setError(null);
    setNotice(null);
    try {
      const nextStatus = target.profile.account_status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
      await platformStore.adminUpdateUserStatus(
        user,
        target.profile.id,
        nextStatus,
        target.profile.profile_verified,
        nextStatus === 'SUSPENDED' ? 'Suspended via Admin Control Centre' : 'Reactivated by Admin'
      );
      setNotice(`Updated ${target.profile.full_name} status to ${nextStatus}.`);
      await loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update user.');
    }
  };

  const handleVerifyUser = async (target: UserWithRoles) => {
    setError(null);
    try {
      await platformStore.adminUpdateUserStatus(
        user,
        target.profile.id,
        target.profile.account_status,
        !target.profile.profile_verified,
        'Profile verification status updated by Admin'
      );
      setNotice(`Updated verification status for ${target.profile.full_name}.`);
      await loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify user.');
    }
  };

  const handleRoleToggle = async (target: UserWithRoles, role: UserRole) => {
    setError(null);
    try {
      const has = target.roles.includes(role);
      const next = has ? target.roles.filter((r) => r !== role) : [...target.roles, role];
      await platformStore.adminAssignUserRoles(user, target.profile.id, next, `Role ${role} toggled by Super Admin`);
      setNotice(`Roles updated for ${target.profile.full_name}.`);
      await loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Role update failed.');
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (newLocPin.trim() && !isValidIndianPincode(newLocPin)) {
      setError('Indian PIN code must be 6 digits and cannot start with 0.');
      return;
    }
    try {
      const stateNode = locations.find((l) => l.level === 'STATE' && l.state_code === newLocState);
      const added = await platformStore.adminAddLocation(user, {
        level: newLocLevel,
        parent_id: stateNode?.id ?? null,
        name: newLocName,
        state_code: newLocState,
        pincode: newLocPin.trim() || null,
      });
      setNewLocName('');
      setNewLocPin('');
      setNotice(`Added location "${added.name}" (${added.state_code ?? 'IN'}).`);
      await loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add location.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      u.profile.full_name.toLowerCase().includes(q) ||
      u.profile.email.toLowerCase().includes(q) ||
      (u.profile.phone?.includes(q) ?? false)
    );
  });

  const statesList = locations.filter((l) => l.level === 'STATE');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 px-6 py-5 text-white">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-saffron-500">
            Super Administrator Control Centre
          </span>
          <h1 className="text-2xl font-extrabold">Platform Governance &amp; Operations</h1>
        </div>
        <div className="text-right text-xs text-slate-300">
          <p>Monthly Budget Guardrail: ₹{BRAND_INFO.budgetTargetInr.min.toLocaleString('en-IN')}–₹{BRAND_INFO.budgetTargetInr.max.toLocaleString('en-IN')}</p>
          <p className="text-slate-400">All administrative mutations write immutable audit logs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <nav className="space-y-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="Admin Navigation">
            {navLinks
              .filter((item) => hasAdminScope(user.roles, item.scope))
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
          </nav>
        </aside>

        <div className="space-y-5 lg:col-span-9">
          {error ? <ErrorBanner message={error} /> : null}
          {notice ? <SuccessBanner message={notice} /> : null}

          {loading ? (
            <LoadingState label="Loading Admin Control Centre..." />
          ) : tab === 'overview' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-slate-500">Registered Users</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">{users.length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-slate-500">Organisations</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">{orgs.length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-slate-500">India States / UTs</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">{statesList.length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-slate-500">Audit Events</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">{auditLogs.length}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Recent Immutable Audit Events</h2>
                <div className="mt-4 space-y-2">
                  {auditLogs.slice(0, 6).map((log) => (
                    <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{log.action}</span>{' '}
                        <span className="text-slate-600">on {log.entity_type} ({log.entity_id ?? 'system'})</span>
                      </div>
                      <span className="text-slate-500">{new Date(log.created_at).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : tab === 'users' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">User &amp; Role Management</h2>
                <input
                  type="search"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Search name, email, phone..."
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
              </div>

              <div className="mt-4 space-y-4">
                {filteredUsers.map((entry) => (
                  <div key={entry.profile.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900">{entry.profile.full_name}</p>
                        <p className="text-xs text-slate-500">
                          {entry.profile.email} · {entry.profile.phone || 'No phone'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={entry.profile.account_status} />
                        <button
                          type="button"
                          onClick={() => handleVerifyUser(entry)}
                          className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          {entry.profile.profile_verified ? 'Unverify' : 'Verify Profile'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleSuspend(entry)}
                          className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          {entry.profile.account_status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
                        </button>
                      </div>
                    </div>

                    {user.roles.includes('super_admin') ? (
                      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                        {ALL_ROLES.map((r) => {
                          const active = entry.roles.includes(r);
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => handleRoleToggle(entry, r)}
                              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                                active
                                  ? 'border-brand-600 bg-brand-50 text-brand-800'
                                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              {ROLE_LABELS[r]}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : tab === 'organisations' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Organisation Approvals &amp; Verification</h2>
              <div className="mt-4 space-y-3">
                {orgs.map((org) => (
                  <div key={org.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                    <div>
                      <p className="font-bold text-slate-900">{org.name}</p>
                      <p className="text-xs text-slate-500">
                        {org.org_type} · {formatLocationBreadcrumb(org.location_id, locations)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={org.status} />
                      <button
                        type="button"
                        onClick={async () => {
                          await platformStore.adminUpdateOrganisationStatus(user, org.id, 'APPROVED', true, 'Approved & verified by admin');
                          setNotice(`Approved ${org.name}.`);
                          await loadAdminData();
                        }}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Approve &amp; Verify
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await platformStore.adminUpdateOrganisationStatus(user, org.id, 'SUSPENDED', false, 'Suspended by admin');
                          setNotice(`Suspended ${org.name}.`);
                          await loadAdminData();
                        }}
                        className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Suspend
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : tab === 'listings' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Listings Moderation Queue</h2>
              <div className="mt-4 space-y-3">
                {listings.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                    <div className="max-w-xl">
                      <p className="font-bold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">
                        Module: {item.module_key} · {formatLocationBreadcrumb(item.location_id, locations)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={item.status} />
                      <button
                        type="button"
                        onClick={async () => {
                          await platformStore.adminUpdateListingStatus(user, item.id, 'APPROVED', item.is_featured, 'Approved by moderation');
                          setNotice(`Approved listing "${item.title}".`);
                          await loadAdminData();
                        }}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await platformStore.adminUpdateListingStatus(user, item.id, item.status, !item.is_featured, 'Featured status toggled');
                          await loadAdminData();
                        }}
                        className="rounded-lg border border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-800"
                      >
                        {item.is_featured ? 'Unfeature' : 'Feature'}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await platformStore.adminUpdateListingStatus(user, item.id, 'SUSPENDED', false, 'Suspended by moderation');
                          await loadAdminData();
                        }}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700"
                      >
                        Suspend
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : tab === 'categories' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Service Categories &amp; Future Modules</h2>
              <p className="mt-1 text-xs text-slate-600">
                Enable or disable initial and future marketplace categories dynamically without code rebuilds.
              </p>
              <div className="mt-4 space-y-2">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {cat.name}{' '}
                        {cat.is_future_module ? (
                          <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            FUTURE MODULE
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-slate-500">{cat.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await platformStore.adminToggleCategory(user, cat.id, !cat.is_enabled);
                        setNotice(`${cat.name} ${!cat.is_enabled ? 'enabled' : 'disabled'}.`);
                        await loadAdminData();
                      }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        cat.is_enabled
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {cat.is_enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : tab === 'locations' ? (
            <div className="space-y-6">
              <form onSubmit={handleAddLocation} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Add District, City, PIN Code or Locality (India)</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <select
                    value={newLocState}
                    onChange={(e) => setNewLocState(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    {statesList.map((st) => (
                      <option key={st.id} value={st.state_code ?? ''}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newLocLevel}
                    onChange={(e) => setNewLocLevel(e.target.value as LocationNode['level'])}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="DISTRICT">District</option>
                    <option value="CITY">City / Town</option>
                    <option value="PINCODE">PIN Code</option>
                    <option value="LOCALITY">Locality</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={newLocName}
                    onChange={(e) => setNewLocName(e.target.value)}
                    placeholder="City / District / Locality name"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    maxLength={6}
                    value={newLocPin}
                    onChange={(e) => setNewLocPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit PIN (optional)"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-4 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
                >
                  Add India Location
                </button>
              </form>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900">
                  Active Locations ({locations.length} total · {statesList.length} States &amp; UTs)
                </h3>
                <div className="mt-3 grid max-h-96 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                  {locations.filter((l) => l.level !== 'COUNTRY').map((loc) => (
                    <div key={loc.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-xs">
                      <span className="font-medium text-slate-800">
                        {loc.name} {loc.pincode ? `(${loc.pincode})` : ''}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {loc.level} · {loc.state_code ?? 'IN'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : tab === 'moderation' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Moderation Reports</h2>
              <div className="mt-4 space-y-3">
                {reports.map((rep) => (
                  <div key={rep.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{rep.reason}</p>
                      <p className="text-xs text-slate-500">
                        Target: {rep.target_type} ({rep.target_id}) · {rep.details}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={rep.status} />
                      <button
                        type="button"
                        onClick={async () => {
                          await platformStore.adminResolveReport(user, rep.id, 'RESOLVED', 'Reviewed and resolved in Admin Centre');
                          await loadAdminData();
                        }}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : tab === 'settings' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Platform Feature Flags &amp; Module Controls</h2>
              <div className="mt-4 space-y-3">
                {flags.map((flag) => (
                  <div key={flag.flag_key} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{flag.label}</p>
                      <p className="text-xs text-slate-500">{flag.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await platformStore.adminToggleFeatureFlag(user, flag.flag_key, !flag.is_enabled);
                        setNotice(`Flag "${flag.flag_key}" set to ${!flag.is_enabled}.`);
                        await loadAdminData();
                      }}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                        flag.is_enabled
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-100 text-slate-700'
                      }`}
                    >
                      {flag.is_enabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : tab === 'audit-logs' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Immutable Audit Logs ({auditLogs.length})</h2>
              <div className="mt-4 space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-slate-200 p-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-brand-800">{log.action}</span>
                      <span className="text-slate-500">{new Date(log.created_at).toLocaleString('en-IN')}</span>
                    </div>
                    <p className="mt-1 text-slate-700">
                      Entity: <code>{log.entity_type}</code> ({log.entity_id ?? 'N/A'}) · Actor Role:{' '}
                      <code>{log.actor_role ?? 'system'}</code>
                    </p>
                    {log.reason ? <p className="mt-0.5 text-slate-500">Reason: {log.reason}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">{shellTitle ?? 'Admin Module'}</h2>
              <p className="mt-2 text-sm text-slate-600">
                Role-protected Admin Control Centre route registered in Phase 1. Full transactional tables and workflows activate in their designated release phase.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
