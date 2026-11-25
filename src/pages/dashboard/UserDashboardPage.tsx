import { Building2, CheckCircle2, Settings, ShieldAlert, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LocationPicker } from '../../components/common/LocationPicker';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ErrorBanner, SuccessBanner } from '../../components/common/StateViews';
import { useAuth } from '../../context/AuthContext';
import { formatLocationBreadcrumb } from '../../services/locationSearch';
import { ROLE_LABELS, SELF_ASSIGNABLE_ROLES } from '../../services/permissions';
import { platformStore } from '../../services/platformStore';
import type { LocationNode, Organisation, OrgType, PreferredLanguage, UserRole } from '../../types/domain';

export function UserDashboardPage({ section = 'overview' }: { section?: string }) {
  const { user, refreshUser } = useAuth();
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Settings state
  const [fullName, setFullName] = useState(user?.profile.full_name ?? '');
  const [phone, setPhone] = useState(user?.profile.phone ?? '');
  const [language, setLanguage] = useState<PreferredLanguage>(user?.profile.preferred_language ?? 'en');
  const [locationId, setLocationId] = useState<string | null>(user?.profile.primary_location_id ?? null);
  const [selfRoles, setSelfRoles] = useState<UserRole[]>(user?.roles ?? ['customer']);

  // New org form
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<OrgType>('COMPANY');
  const [orgRegNo, setOrgRegNo] = useState('');

  useEffect(() => {
    if (!user) return;
    setFullName(user.profile.full_name);
    setPhone(user.profile.phone ?? '');
    setLanguage(user.profile.preferred_language);
    setLocationId(user.profile.primary_location_id);
    setSelfRoles(user.roles);
    void Promise.all([
      platformStore.getLocations(false),
      platformStore.getMyOrganisations(user.profile.id),
    ]).then(([locs, myOrgs]) => {
      setLocations(locs);
      setOrgs(myOrgs);
    });
  }, [user]);

  if (!user) return null;

  const toggleRole = (role: UserRole) => {
    if (role === 'customer') return;
    setSelfRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await platformStore.updateMyProfile(user.profile.id, {
        full_name: fullName,
        phone: phone || null,
        preferred_language: language,
        primary_location_id: locationId,
        selfRoles,
      });
      await refreshUser();
      setMessage('Profile and role preferences updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const created = await platformStore.createOrganisation(user.profile.id, {
        name: orgName,
        org_type: orgType,
        location_id: locationId,
        registration_number: orgRegNo || undefined,
      });
      setOrgs((prev) => [created, ...prev]);
      setOrgName('');
      setOrgRegNo('');
      setMessage(`Organisation "${created.name}" created and queued for admin approval.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create organisation.');
    }
  };

  const handleDeletionRequest = async () => {
    setError(null);
    setMessage(null);
    try {
      await platformStore.requestAccountDeletion(user.profile.id);
      await refreshUser();
      setMessage('Account deletion request recorded under DPDPA retention guidelines.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit deletion request.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <UserCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{user.profile.full_name}</p>
                <p className="truncate text-xs text-slate-500">{user.profile.email}</p>
              </div>
            </div>

            <nav className="mt-3 space-y-1 text-sm">
              <Link to="/dashboard" className="block rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100">
                Overview
              </Link>
              <Link to="/dashboard/settings" className="block rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100">
                Profile, Roles &amp; Organisations
              </Link>
              <Link to="/dashboard/enquiries" className="block rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100">
                Enquiries (Phase 6)
              </Link>
              <Link to="/dashboard/applications" className="block rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100">
                Job Applications (Phase 2)
              </Link>
              <Link to="/dashboard/payments" className="block rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100">
                Payments &amp; Invoices (Phase 5)
              </Link>
            </nav>
          </div>
        </aside>

        <div className="space-y-6 lg:col-span-9">
          {error ? <ErrorBanner message={error} /> : null}
          {message ? <SuccessBanner message={message} /> : null}

          {section === 'overview' ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">Account Overview</h1>
                    <p className="mt-1 text-sm text-slate-600">
                      Location: {formatLocationBreadcrumb(user.profile.primary_location_id, locations)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={user.profile.account_status} />
                    {user.profile.profile_verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {user.roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
                    >
                      {ROLE_LABELS[role]}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">My Organisations ({orgs.length})</h2>
                  <Link to="/dashboard/settings" className="text-xs font-semibold text-brand-700 hover:underline">
                    Manage Organisations →
                  </Link>
                </div>
                {orgs.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-600">
                    No organisations linked yet. Create a company, agency, or school under Profile Settings.
                  </p>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {orgs.map((org) => (
                      <div key={org.id} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900">{org.name}</span>
                          <StatusBadge status={org.status} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {org.org_type} · {formatLocationBreadcrumb(org.location_id, locations)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : section === 'settings' ? (
            <div className="space-y-6">
              <form onSubmit={handleSaveSettings} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-brand-700">
                  <Settings className="h-5 w-5" />
                  <h1 className="text-xl font-bold text-slate-900">Profile &amp; Multi-Role Settings</h1>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-1 block text-xs font-medium text-slate-700">Preferred Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as PreferredLanguage)}
                    className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="ml">Malayalam</option>
                  </select>
                </div>

                <div className="mt-4">
                  <LocationPicker locations={locations} value={locationId} onChange={setLocationId} />
                </div>

                <div className="mt-5">
                  <span className="mb-2 block text-xs font-medium text-slate-700">Active Marketplace Roles</span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {SELF_ASSIGNABLE_ROLES.map((role) => (
                      <label key={role} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium">
                        <input
                          type="checkbox"
                          checked={selfRoles.includes(role)}
                          disabled={role === 'customer'}
                          onChange={() => toggleRole(role)}
                        />
                        <span>{ROLE_LABELS[role]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-5 rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800"
                >
                  Save Profile &amp; Roles
                </button>
              </form>

              <form onSubmit={handleCreateOrg} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-brand-700">
                  <Building2 className="h-5 w-5" />
                  <h2 className="text-lg font-bold text-slate-900">Register an Organisation</h2>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Company, School, or Agency Name"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value as OrgType)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="COMPANY">Company / Employer</option>
                    <option value="AGENCY">Property Agency</option>
                    <option value="SCHOOL">School / College</option>
                    <option value="INSTITUTION">Coaching / Tuition</option>
                    <option value="SERVICE_BUSINESS">Service Business</option>
                  </select>
                  <input
                    type="text"
                    value={orgRegNo}
                    onChange={(e) => setOrgRegNo(e.target.value)}
                    placeholder="Reg / Affiliation No (optional)"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-4 rounded-lg border border-brand-700 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                >
                  Create Organisation
                </button>
              </form>

              <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
                <div className="flex items-center gap-2 text-red-700">
                  <ShieldAlert className="h-5 w-5" />
                  <h2 className="text-base font-bold">Account Deletion Request (DPDPA)</h2>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Submit a formal deletion request for your personal profile. Statutory financial and audit logs remain retained per Indian law.
                </p>
                <button
                  type="button"
                  onClick={handleDeletionRequest}
                  disabled={user.profile.account_status === 'PENDING_DELETION'}
                  className="mt-3 rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {user.profile.account_status === 'PENDING_DELETION'
                    ? 'Deletion Request Recorded'
                    : 'Request Account Deletion'}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h1 className="text-2xl font-bold capitalize text-slate-900">{section.replace('-', ' ')} Workspace</h1>
              <p className="mt-2 text-sm text-slate-600">
                Protected route ready. Full domain workflows for this workspace activate in their scheduled release phase while sharing Phase 1 authentication, organisations, and RLS.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
