import { Briefcase, IndianRupee, MapPin, MessageSquare, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocationPicker } from '../../components/common/LocationPicker';
import { EmptyState, ErrorBanner, LoadingState, SuccessBanner } from '../../components/common/StateViews';
import { useAuth } from '../../context/AuthContext';
import { INDIA_LOCATIONS_SEED } from '../../data/indiaLocationsSeed';
import { formatLocationBreadcrumb } from '../../services/locationSearch';
import { staffStore } from '../../services/staffStore';
import type { EmploymentType, JobPost } from '../../types/staff';

const QUALIFICATIONS = ['ALL', '10th', '12th', 'Diploma', 'Graduate', 'B.Tech', 'Postgraduate', 'B.Ed', 'MBA'];

export function JobsDirectoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType | 'ALL'>('ALL');
  const [qualification, setQualification] = useState('ALL');
  const [skill, setSkill] = useState('');
  const [maxExperience, setMaxExperience] = useState<string>('');
  const [minSalary, setMinSalary] = useState<string>('');
  const [locationId, setLocationId] = useState<string | null>(null);
  const [sort, setSort] = useState<'newest' | 'salary_desc' | 'exp_asc'>('newest');
  const [page, setPage] = useState(1);

  const [applyingJob, setApplyingJob] = useState<JobPost | null>(null);
  const [coverNote, setCoverNote] = useState('');

  const [enquiryJob, setEnquiryJob] = useState<JobPost | null>(null);
  const [enquirySubject, setEnquirySubject] = useState('');
  const [enquiryMessage, setEnquiryMessage] = useState('');

  const runSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await staffStore.searchJobs({
        query,
        employmentType,
        qualification,
        skill,
        maxExperience: maxExperience ? Number(maxExperience) : undefined,
        minSalary: minSalary ? Number(minSalary) : undefined,
        locationId: locationId ?? undefined,
        sort,
        page,
        pageSize: 9,
      });
      setJobs(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job vacancies.');
    } finally {
      setLoading(false);
    }
  }, [query, employmentType, qualification, skill, maxExperience, minSalary, locationId, sort, page]);

  useEffect(() => {
    void runSearch();
  }, [runSearch]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!applyingJob) return;
    setError(null);
    setNotice(null);
    try {
      await staffStore.applyToJob(user, applyingJob.id, { coverNote });
      setNotice(`Application submitted for "${applyingJob.title}". Track status in Dashboard → Applications.`);
      setApplyingJob(null);
      setCoverNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit application.');
    }
  };

  const handleSendEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!enquiryJob) return;
    setError(null);
    setNotice(null);
    try {
      await staffStore.sendRecruitmentEnquiry(user, {
        jobPostId: enquiryJob.id,
        employerId: enquiryJob.employer_id,
        subject: enquirySubject,
        message: enquiryMessage,
      });
      setNotice(`Recruitment enquiry sent to ${enquiryJob.employer_name}.`);
      setEnquiryJob(null);
      setEnquirySubject('');
      setEnquiryMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send enquiry.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">Job Vacancies Across India</h1>
        <p className="mt-1 text-sm text-slate-600">
          Filter by job title, qualification, skills, experience, monthly salary, employment type, and Indian location.
        </p>
      </div>

      {/* Filters Panel */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          void runSearch();
        }}
        className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-700">Job Title / Keyword</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Teacher, Engineer, Sales..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Employment Type</label>
            <select
              aria-label="Employment Type"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as EmploymentType | 'ALL')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="ALL">All Types</option>
              <option value="FULL_TIME">Full-Time</option>
              <option value="PART_TIME">Part-Time</option>
              <option value="TEMPORARY">Temporary</option>
              <option value="CONTRACT">Contract</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Qualification</label>
            <select
              aria-label="Qualification"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {QUALIFICATIONS.map((q) => (
                <option key={q} value={q}>
                  {q === 'ALL' ? 'Any Qualification' : q}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Skill</label>
            <input
              type="text"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="e.g. React, Python"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Min Salary (₹/mo)</label>
            <input
              type="number"
              min={0}
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              placeholder="e.g. 20000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 items-end gap-3 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <LocationPicker locations={INDIA_LOCATIONS_SEED} value={locationId} onChange={setLocationId} />
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-700">Max Exp (Yrs)</label>
            <input
              type="number"
              min={0}
              value={maxExperience}
              onChange={(e) => setMaxExperience(e.target.value)}
              placeholder="e.g. 5"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-700">Sort By</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'newest' | 'salary_desc' | 'exp_asc')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="salary_desc">Highest Salary</option>
              <option value="exp_asc">Lowest Experience</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <button
              type="submit"
              className="w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </form>

      {error ? <div className="mb-4"><ErrorBanner message={error} /></div> : null}
      {notice ? <div className="mb-4"><SuccessBanner message={notice} /></div> : null}

      {/* Application Modal */}
      {applyingJob ? (
        <form onSubmit={handleApply} className="mb-6 rounded-2xl border border-brand-300 bg-brand-50/70 p-6">
          <h2 className="text-lg font-bold text-slate-900">Apply for: {applyingJob.title}</h2>
          <p className="mt-1 text-xs text-slate-600">
            Your primary CV (if uploaded in Candidate Profile) will be attached automatically and accessible only to this employer.
          </p>
          <textarea
            rows={3}
            value={coverNote}
            onChange={(e) => setCoverNote(e.target.value)}
            placeholder="Brief note about your relevant experience & availability..."
            className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
          <div className="mt-3 flex gap-2">
            <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
              Submit Application
            </button>
            <button
              type="button"
              onClick={() => setApplyingJob(null)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {/* Recruitment Enquiry Modal */}
      {enquiryJob ? (
        <form onSubmit={handleSendEnquiry} className="mb-6 rounded-2xl border border-amber-300 bg-amber-50/70 p-6">
          <h2 className="text-lg font-bold text-slate-900">Recruitment Enquiry: {enquiryJob.title}</h2>
          <div className="mt-3 space-y-3">
            <input
              type="text"
              required
              value={enquirySubject}
              onChange={(e) => setEnquirySubject(e.target.value)}
              placeholder="Subject (e.g. Shift timing, relocation support)"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <textarea
              rows={3}
              required
              value={enquiryMessage}
              onChange={(e) => setEnquiryMessage(e.target.value)}
              placeholder="Write your enquiry to the employer..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
              Send Enquiry
            </button>
            <button
              type="button"
              onClick={() => setEnquiryJob(null)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {/* Results */}
      {loading ? (
        <LoadingState label="Finding matching vacancies..." />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No jobs match your current filters"
          description="Try widening the salary range, qualification, or location filter."
        />
      ) : (
        <>
          <p className="mb-3 text-xs font-medium text-slate-500">Showing {jobs.length} of {total} job(s)</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <article key={job.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">
                      {job.employment_type.replace('_', ' ')} · {job.work_mode}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">{job.openings_count} opening(s)</span>
                  </div>
                  <h2 className="mt-3 text-base font-bold text-slate-900">{job.title}</h2>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">{job.employer_name}</p>
                  <p className="mt-2 text-sm text-slate-600">{job.summary}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.skills_required.map((sk) => (
                      <span key={sk} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-brand-600" />
                    <span>{job.qualification_required} · {job.min_experience_years}+ yrs exp</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-brand-600" />
                    <span>{formatLocationBreadcrumb(job.location_id, INDIA_LOCATIONS_SEED)}</span>
                  </div>
                  {job.salary_min || job.salary_max ? (
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                      <IndianRupee className="h-3.5 w-3.5" />
                      <span>
                        ₹{(job.salary_min ?? 0).toLocaleString('en-IN')} – ₹{(job.salary_max ?? 0).toLocaleString('en-IN')} / {job.salary_period.toLowerCase()}
                      </span>
                    </div>
                  ) : null}

                  <div className="mt-3 flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!user) {
                          navigate('/login');
                          return;
                        }
                        setApplyingJob(job);
                      }}
                      className="flex-1 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
                    >
                      Apply Now
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!user) {
                          navigate('/login');
                          return;
                        }
                        setEnquiryJob(job);
                        setEnquirySubject(`Enquiry regarding ${job.title}`);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      title="Send Recruitment Enquiry"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Enquire</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {total > 9 ? (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-600">Page {page}</span>
              <button
                type="button"
                disabled={page * 9 >= total}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
