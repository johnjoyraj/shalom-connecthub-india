import { ArrowRight, Briefcase, Building2, CheckCircle2, FileText, MapPin, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { INDIA_LOCATIONS_SEED } from '../../data/indiaLocationsSeed';
import { formatLocationBreadcrumb } from '../../services/locationSearch';
import { staffStore } from '../../services/staffStore';
import type { JobPost } from '../../types/staff';

export function StaffHubPage() {
  const [recentJobs, setRecentJobs] = useState<JobPost[]>([]);

  useEffect(() => {
    void staffStore.searchJobs({ pageSize: 3 }).then((res) => setRecentJobs(res.items));
  }, []);

  return (
    <div>
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 px-4 py-12 text-white sm:px-6">
        <div className="mx-auto max-w-6xl">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
            Module A · Staff Connect (All India)
          </span>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Hire Verified Talent &amp; Discover Opportunities Across India
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-brand-100">
            Full-time, part-time, temporary, and contract vacancies with structured candidate CVs, privacy controls, shortlisting, and recruitment enquiries.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-brand-900 shadow-sm hover:bg-brand-50"
            >
              <Briefcase className="h-4 w-4" />
              <span>Browse All Jobs</span>
            </Link>
            <Link
              to="/candidates"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
            >
              <Users className="h-4 w-4" />
              <span>Find Candidates</span>
            </Link>
            <Link
              to="/employer/jobs"
              className="inline-flex items-center gap-2 rounded-lg bg-saffron-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-saffron-600"
            >
              <span>Post a Job Vacancy</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-brand-700">
              <FileText className="h-5 w-5" />
              <h2 className="text-lg font-bold text-slate-900">For Job Seekers &amp; Candidates</h2>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Build education, experience &amp; skills profile</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Private CV upload accessible only to employers you apply to</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Real-time application tracking &amp; shortlist timeline</li>
            </ul>
            <Link to="/dashboard/applications" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
              Open Candidate Profile &amp; Applications <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-brand-700">
              <Building2 className="h-5 w-5" />
              <h2 className="text-lg font-bold text-slate-900">For Employers &amp; Schools</h2>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Post full-time, part-time, temporary &amp; contract jobs</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Filter candidates by qualification, skills, salary &amp; PIN code</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Shortlist applicants &amp; manage recruitment enquiries</li>
            </ul>
            <Link to="/employer" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
              Open Employer Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Latest Open Vacancies</h2>
            <Link to="/jobs" className="text-sm font-semibold text-brand-700 hover:underline">
              View All Jobs →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {recentJobs.map((job) => (
              <div key={job.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="rounded bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">
                  {job.employment_type.replace('_', ' ')}
                </span>
                <h3 className="mt-2 font-bold text-slate-900">{job.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{job.employer_name}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-slate-600">
                  <MapPin className="h-3.5 w-3.5 text-brand-600" />
                  {formatLocationBreadcrumb(job.location_id, INDIA_LOCATIONS_SEED)}
                </p>
                {job.salary_min || job.salary_max ? (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">
                    ₹{(job.salary_min ?? 0).toLocaleString('en-IN')} – ₹{(job.salary_max ?? 0).toLocaleString('en-IN')} / {job.salary_period.toLowerCase()}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
