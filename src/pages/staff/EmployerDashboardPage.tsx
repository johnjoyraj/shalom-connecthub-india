import { Briefcase, CheckCircle2, CreditCard, FileText, MessageSquare, Plus, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LocationPicker } from '../../components/common/LocationPicker';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ErrorBanner, LoadingState, SuccessBanner } from '../../components/common/StateViews';
import { useAuth } from '../../context/AuthContext';
import { INDIA_LOCATIONS_SEED } from '../../data/indiaLocationsSeed';
import { DEFAULT_PRICING_TIERS } from '../../data/platformDefaults';
import { formatLocationBreadcrumb } from '../../services/locationSearch';
import { staffStore } from '../../services/staffStore';
import type {
  ApplicationStatus,
  EmploymentType,
  JobApplication,
  JobPost,
  RecruitmentEnquiry,
  SalaryPeriod,
  WorkMode,
} from '../../types/staff';
import { CandidatesDirectoryPage } from './CandidatesDirectoryPage';

export type EmployerTab = 'overview' | 'jobs' | 'candidates' | 'applications' | 'shortlist' | 'subscription';

export function EmployerDashboardPage({ tab }: { tab: EmployerTab }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [enquiries, setEnquiries] = useState<RecruitmentEnquiry[]>([]);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  // Create Job Form State
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [empType, setEmpType] = useState<EmploymentType>('FULL_TIME');
  const [workMode, setWorkMode] = useState<WorkMode>('ONSITE');
  const [qualification, setQualification] = useState('Graduate');
  const [minExp, setMinExp] = useState('1');
  const [salaryMin, setSalaryMin] = useState('20000');
  const [salaryMax, setSalaryMax] = useState('45000');
  const [salaryPeriod, setSalaryPeriod] = useState<SalaryPeriod>('MONTHLY');
  const [skillsText, setSkillsText] = useState('');
  const [locationId, setLocationId] = useState<string | null>('loc-city-in-ka-bengaluru');
  const [openings, setOpenings] = useState('1');

  const loadEmployerData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [myJobs, myApps, myEnquiries] = await Promise.all([
        staffStore.getEmployerJobs(user.profile.id),
        staffStore.getEmployerApplications(user),
        staffStore.getRecruitmentEnquiries(user),
      ]);
      setJobs(myJobs);
      setApplications(myApps);
      setEnquiries(myEnquiries.filter((e) => e.employer_id === user.profile.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load employer workspace.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadEmployerData();
  }, [loadEmployerData]);

  if (!user) return null;

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      const created = await staffStore.createJobPost(user, {
        title,
        summary,
        description: description || summary,
        location_id: locationId,
        employment_type: empType,
        work_mode: workMode,
        min_experience_years: Number(minExp) || 0,
        max_experience_years: null,
        qualification_required: qualification,
        skills_required: skillsText.split(',').map((s) => s.trim()).filter(Boolean),
        salary_min: salaryMin ? Number(salaryMin) : null,
        salary_max: salaryMax ? Number(salaryMax) : null,
        salary_period: salaryPeriod,
        openings_count: Number(openings) || 1,
      });
      setTitle('');
      setSummary('');
      setDescription('');
      setSkillsText('');
      setNotice(`Job vacancy "${created.title}" published.`);
      await loadEmployerData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish job post.');
    }
  };

  const handleApplicationStatus = async (appId: string, status: ApplicationStatus) => {
    setError(null);
    try {
      await staffStore.updateApplicationStatus(user, appId, status, `Marked ${status} by employer`);
      setNotice(`Application moved to ${status}.`);
      await loadEmployerData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update application.');
    }
  };

  const handleInspectCv = async (docId: string | null) => {
    if (!docId) {
      setNotice('Applicant did not attach a CV document.');
      return;
    }
    try {
      const doc = await staffStore.getAuthorizedCvDocument(user, docId);
      setNotice(`Authorized CV access verified: ${doc.file_name} (${Math.round(doc.file_size_bytes / 1024)} KB)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CV access denied.');
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'
    }`;

  const shortlisted = applications.filter((a) =>
    ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFERED', 'HIRED'].includes(a.status)
  );
  const jobMap = new Map(jobs.map((j) => [j.id, j]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-950 px-6 py-5 text-white">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-saffron-500">
            Module A · Employer Control Portal
          </span>
          <h1 className="text-2xl font-extrabold">Hiring &amp; Recruitment Workspace</h1>
        </div>
        <Link to="/jobs" className="rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20">
          View Public Job Board →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <nav className="space-y-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <NavLink to="/employer" end className={navLinkClass}><Briefcase className="h-4 w-4" /> Overview</NavLink>
            <NavLink to="/employer/jobs" className={navLinkClass}><Plus className="h-4 w-4" /> Job Vacancies</NavLink>
            <NavLink to="/employer/applications" className={navLinkClass}><FileText className="h-4 w-4" /> Applications ({applications.length})</NavLink>
            <NavLink to="/employer/shortlist" className={navLinkClass}><CheckCircle2 className="h-4 w-4" /> Shortlist &amp; Enquiries</NavLink>
            <NavLink to="/employer/candidates" className={navLinkClass}><Users className="h-4 w-4" /> Search Candidates</NavLink>
            <NavLink to="/employer/subscription" className={navLinkClass}><CreditCard className="h-4 w-4" /> Job Subscriptions</NavLink>
          </nav>
        </aside>

        <div className="space-y-6 lg:col-span-9">
          {error ? <ErrorBanner message={error} /> : null}
          {notice ? <SuccessBanner message={notice} /> : null}

          {loading ? (
            <LoadingState label="Loading Employer Dashboard..." />
          ) : tab === 'overview' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Posted Vacancies</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">{jobs.length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Total Applications</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">{applications.length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Shortlisted</p>
                  <p className="mt-1 text-2xl font-extrabold text-emerald-700">{shortlisted.length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Recruitment Enquiries</p>
                  <p className="mt-1 text-2xl font-extrabold text-brand-700">{enquiries.length}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Your Active Vacancies</h2>
                <div className="mt-4 space-y-3">
                  {jobs.map((j) => (
                    <div key={j.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-4">
                      <div>
                        <p className="font-bold text-slate-900">{j.title}</p>
                        <p className="text-xs text-slate-500">
                          {j.employment_type.replace('_', ' ')} · {formatLocationBreadcrumb(j.location_id, INDIA_LOCATIONS_SEED)}
                        </p>
                      </div>
                      <StatusBadge status={j.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : tab === 'jobs' ? (
            <div className="space-y-6">
              <form onSubmit={handleCreateJob} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Post a New Job Vacancy</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Job Title (e.g. Science Teacher, Store Manager)"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <select
                    value={empType}
                    onChange={(e) => setEmpType(e.target.value as EmploymentType)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="FULL_TIME">Full-Time</option>
                    <option value="PART_TIME">Part-Time</option>
                    <option value="TEMPORARY">Temporary</option>
                    <option value="CONTRACT">Contract</option>
                  </select>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <select
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="ONSITE">Onsite</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="REMOTE">Remote</option>
                  </select>
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="Required Qualification"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    value={minExp}
                    onChange={(e) => setMinExp(e.target.value)}
                    placeholder="Min Exp (Years)"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <input
                    type="number"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                    placeholder="Min Salary (₹)"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                    placeholder="Max Salary (₹)"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <select
                    value={salaryPeriod}
                    onChange={(e) => setSalaryPeriod(e.target.value as SalaryPeriod)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="ANNUAL">Annual</option>
                    <option value="HOURLY">Hourly</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={openings}
                    onChange={(e) => setOpenings(e.target.value)}
                    placeholder="Openings"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="Required Skills (comma separated, e.g. React, Communication, Hindi)"
                  className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />

                <input
                  type="text"
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="One-line role summary"
                  className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />

                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed responsibilities, shift timings, and perks..."
                  className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />

                <div className="mt-3">
                  <LocationPicker locations={INDIA_LOCATIONS_SEED} value={locationId} onChange={setLocationId} label="Job Location" />
                </div>

                <button type="submit" className="mt-4 rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800">
                  Publish Job Vacancy
                </button>
              </form>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900">Manage Job Posts ({jobs.length})</h3>
                <div className="mt-3 space-y-3">
                  {jobs.map((j) => (
                    <div key={j.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-4">
                      <div>
                        <p className="font-bold text-slate-900">{j.title}</p>
                        <p className="text-xs text-slate-500">{j.employment_type} · {j.openings_count} opening(s)</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={j.status} />
                        <button
                          type="button"
                          onClick={async () => {
                            await staffStore.updateJobPostStatus(user, j.id, j.status === 'OPEN' ? 'PAUSED' : 'OPEN');
                            await loadEmployerData();
                          }}
                          className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium"
                        >
                          {j.status === 'OPEN' ? 'Pause' : 'Reopen'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : tab === 'applications' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Applicant Review Pipeline ({applications.length})</h2>
              <div className="mt-4 space-y-3">
                {applications.map((app) => (
                  <div key={app.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900">{app.applicant_name}</p>
                        <p className="text-xs text-slate-500">
                          For: {jobMap.get(app.job_post_id)?.title ?? app.job_post_id}
                        </p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                    {app.cover_note ? <p className="mt-2 text-xs text-slate-700">{app.cover_note}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleInspectCv(app.cv_document_id)}
                        className="rounded-lg border border-brand-300 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
                      >
                        Verify / View CV
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplicationStatus(app.id, 'SHORTLISTED')}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white"
                      >
                        Shortlist
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplicationStatus(app.id, 'INTERVIEW_SCHEDULED')}
                        className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium"
                      >
                        Interview
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplicationStatus(app.id, 'REJECTED')}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : tab === 'shortlist' ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Shortlisted Candidates ({shortlisted.length})</h2>
                <div className="mt-4 space-y-2">
                  {shortlisted.map((app) => (
                    <div key={app.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
                      <div>
                        <p className="font-bold text-slate-900">{app.applicant_name}</p>
                        <p className="text-xs text-slate-500">{jobMap.get(app.job_post_id)?.title ?? app.job_post_id}</p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-brand-700">
                  <MessageSquare className="h-5 w-5" />
                  <h2 className="text-lg font-bold text-slate-900">Recruitment Enquiries ({enquiries.length})</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {enquiries.map((enq) => (
                    <div key={enq.id} className="rounded-xl border border-slate-200 p-4 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{enq.subject} — {enq.sender_name}</span>
                        <StatusBadge status={enq.status} />
                      </div>
                      <p className="mt-1 text-slate-600">{enq.message}</p>
                      {enq.employer_reply ? (
                        <p className="mt-2 text-emerald-700"><strong>Your Reply:</strong> {enq.employer_reply}</p>
                      ) : (
                        <div className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={replyText[enq.id] ?? ''}
                            onChange={(e) => setReplyText((prev) => ({ ...prev, [enq.id]: e.target.value }))}
                            placeholder="Write reply..."
                            className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              await staffStore.replyToRecruitmentEnquiry(user, enq.id, replyText[enq.id] || 'Thank you for reaching out.');
                              setNotice('Reply sent.');
                              await loadEmployerData();
                            }}
                            className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Reply
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : tab === 'candidates' ? (
            <CandidatesDirectoryPage />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Job Advertisement Subscriptions</h2>
              <p className="mt-1 text-xs text-slate-600">
                Active Job Posts: <strong>{jobs.filter((j) => j.status === 'OPEN').length}</strong> · Plan rates are administrator-configured (Razorpay checkout activates in Phase 5).
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {DEFAULT_PRICING_TIERS.slice(0, 3).map((tier) => (
                  <div key={tier.code} className="rounded-xl border border-slate-200 p-4">
                    <p className="font-bold text-slate-900">{tier.name}</p>
                    <p className="text-xl font-extrabold text-brand-700">₹{tier.monthly_inr}/mo</p>
                    <p className="mt-1 text-xs text-slate-500">Up to {tier.active_listings_limit} active vacancies</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
