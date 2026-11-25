import { Briefcase, FileUp, GraduationCap, Plus, UserCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LocationPicker } from '../../components/common/LocationPicker';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ErrorBanner, LoadingState, SuccessBanner } from '../../components/common/StateViews';
import { useAuth } from '../../context/AuthContext';
import { INDIA_LOCATIONS_SEED } from '../../data/indiaLocationsSeed';
import { staffStore } from '../../services/staffStore';
import type {
  ApplicationEvent,
  CandidateDocument,
  CandidateEducation,
  CandidateExperience,
  CandidateProfile,
  EmploymentType,
  JobApplication,
  JobPost,
  RecruitmentEnquiry,
} from '../../types/staff';

export function CandidateDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [educations, setEducations] = useState<CandidateEducation[]>([]);
  const [experiences, setExperiences] = useState<CandidateExperience[]>([]);
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [events, setEvents] = useState<ApplicationEvent[]>([]);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [enquiries, setEnquiries] = useState<RecruitmentEnquiry[]>([]);

  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [qualification, setQualification] = useState('Graduate');
  const [expYears, setExpYears] = useState('0');
  const [skillsText, setSkillsText] = useState('');
  const [locationId, setLocationId] = useState<string | null>(null);
  const [isSearchable, setIsSearchable] = useState(true);

  const [degree, setDegree] = useState('');
  const [institution, setInstitution] = useState('');
  const [gradYear, setGradYear] = useState('');

  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expType, setExpType] = useState<EmploymentType>('FULL_TIME');

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [candData, appData, enqList] = await Promise.all([
        staffStore.getOrCreateMyCandidateProfile(user),
        staffStore.getMyApplications(user.profile.id),
        staffStore.getRecruitmentEnquiries(user),
      ]);
      setProfile(candData.profile);
      setEducations(candData.educations);
      setExperiences(candData.experiences);
      setDocuments(candData.documents);
      setApplications(appData.applications);
      setEvents(appData.events);
      setJobs(appData.jobs);
      setEnquiries(enqList.filter((e) => e.sender_id === user.profile.id));

      setHeadline(candData.profile.headline);
      setBio(candData.profile.bio);
      setQualification(candData.profile.highest_qualification);
      setExpYears(String(candData.profile.total_experience_years));
      setSkillsText(candData.profile.skills.join(', '));
      setLocationId(candData.profile.current_location_id);
      setIsSearchable(candData.profile.is_public_searchable);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load candidate dashboard.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  if (!user) return null;
  if (loading) return <LoadingState label="Loading your Candidate Profile & Applications..." />;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      const skills = skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await staffStore.saveCandidateProfile(user, {
        headline,
        bio,
        highest_qualification: qualification,
        total_experience_years: Number(expYears) || 0,
        skills,
        current_location_id: locationId,
        is_public_searchable: isSearchable,
      });
      setNotice('Candidate profile updated.');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save candidate profile.');
    }
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await staffStore.addCandidateEducation(user, {
        degree,
        institution,
        field_of_study: null,
        start_year: null,
        end_year: gradYear ? Number(gradYear) : null,
        grade: null,
      });
      setDegree('');
      setInstitution('');
      setGradYear('');
      setNotice('Education added.');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add education.');
    }
  };

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await staffStore.addCandidateExperience(user, {
        job_title: expTitle,
        company_name: expCompany,
        employment_type: expType,
        start_date: null,
        end_date: null,
        is_current: false,
        description: null,
      });
      setExpTitle('');
      setExpCompany('');
      setNotice('Work experience added.');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add experience.');
    }
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      await staffStore.uploadCandidateCv(user, {
        name: file.name,
        size: file.size,
        type: file.type,
        fileObj: file,
      });
      setNotice(`Uploaded private CV "${file.name}".`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CV upload failed.');
    }
  };

  const jobMap = new Map(jobs.map((j) => [j.id, j]));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Candidate Profile &amp; Job Applications</h1>
          <p className="text-sm text-slate-600">
            Manage your qualifications, experience, private CV, and track every job application.
          </p>
        </div>
        <Link to="/jobs" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
          Browse Open Jobs
        </Link>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {notice ? <SuccessBanner message={notice} /> : null}

      {/* Applications Tracking */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-brand-700">
          <Briefcase className="h-5 w-5" />
          <h2 className="text-lg font-bold text-slate-900">My Job Applications ({applications.length})</h2>
        </div>

        {applications.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            You haven&apos;t applied to any vacancies yet. Visit <Link to="/jobs" className="font-semibold text-brand-700 underline">Job Vacancies</Link>.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {applications.map((app) => {
              const job = jobMap.get(app.job_post_id);
              const appEvents = events.filter((ev) => ev.application_id === app.id);
              return (
                <div key={app.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900">{job?.title ?? `Job #${app.job_post_id}`}</p>
                      <p className="text-xs text-slate-500">
                        Applied {new Date(app.created_at).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={app.status} />
                      {app.status !== 'WITHDRAWN' && app.status !== 'HIRED' ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await staffStore.withdrawApplication(user, app.id);
                            setNotice('Application withdrawn.');
                            await loadAll();
                          }}
                          className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Withdraw
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {appEvents.length > 0 ? (
                    <div className="mt-2 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                      Latest update: <strong>{appEvents[0].to_status}</strong> — {appEvents[0].note ?? 'Status updated'}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Candidate Profile & CV Upload */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <form onSubmit={handleSaveProfile} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7">
          <div className="flex items-center gap-2 text-brand-700">
            <UserCheck className="h-5 w-5" />
            <h2 className="text-lg font-bold text-slate-900">Candidate Profile ({profile?.full_name})</h2>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Professional Headline</label>
            <input
              type="text"
              required
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Highest Qualification</label>
              <select
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="10th">10th</option>
                <option value="12th">12th</option>
                <option value="Diploma">Diploma</option>
                <option value="Graduate">Graduate</option>
                <option value="B.Tech">B.Tech</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="B.Ed">B.Ed</option>
                <option value="MBA">MBA</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Total Experience (Years)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={expYears}
                onChange={(e) => setExpYears(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Skills (comma separated)</label>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="React, Tally, Teaching, Sales, English..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Summary / Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <LocationPicker locations={INDIA_LOCATIONS_SEED} value={locationId} onChange={setLocationId} label="Current City" />

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={isSearchable}
              onChange={(e) => setIsSearchable(e.target.checked)}
            />
            <span>Allow verified employers to discover my profile summary (CV remains private)</span>
          </label>

          <button type="submit" className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            Save Candidate Profile
          </button>
        </form>

        {/* CV Upload + Education + Experience */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-brand-700">
              <FileUp className="h-5 w-5" />
              <h2 className="text-base font-bold text-slate-900">Private CV / Resume Upload</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Stored in private storage. Accessible only to you and employers you apply to.
            </p>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleCvUpload}
              className="mt-3 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:font-semibold file:text-brand-700"
            />
            <ul className="mt-3 space-y-1.5 text-xs">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <span className="truncate font-medium text-slate-800">{doc.file_name}</span>
                  {doc.is_primary_cv ? (
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Primary</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={handleAddEducation} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-brand-700">
              <GraduationCap className="h-5 w-5" />
              <h2 className="text-base font-bold text-slate-900">Education ({educations.length})</h2>
            </div>
            <div className="mt-3 space-y-2">
              <input
                type="text"
                required
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="Degree / Certificate (e.g. B.Com, B.Ed)"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="University / Board"
                  className="col-span-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
                <input
                  type="number"
                  value={gradYear}
                  onChange={(e) => setGradYear(e.target.value)}
                  placeholder="Year"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
              </div>
              <button type="submit" className="inline-flex items-center gap-1 rounded-lg border border-brand-600 px-3 py-1.5 text-xs font-semibold text-brand-700">
                <Plus className="h-3.5 w-3.5" /> Add Education
              </button>
            </div>
            <ul className="mt-3 space-y-1 text-xs text-slate-600">
              {educations.map((ed) => (
                <li key={ed.id}>• <strong>{ed.degree}</strong> — {ed.institution} {ed.end_year ? `(${ed.end_year})` : ''}</li>
              ))}
            </ul>
          </form>

          <form onSubmit={handleAddExperience} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">Work Experience ({experiences.length})</h2>
            <div className="mt-3 space-y-2">
              <input
                type="text"
                required
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
                placeholder="Job Title"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={expCompany}
                  onChange={(e) => setExpCompany(e.target.value)}
                  placeholder="Organisation"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
                <select
                  value={expType}
                  onChange={(e) => setExpType(e.target.value as EmploymentType)}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
                >
                  <option value="FULL_TIME">Full-Time</option>
                  <option value="PART_TIME">Part-Time</option>
                  <option value="TEMPORARY">Temporary</option>
                  <option value="CONTRACT">Contract</option>
                </select>
              </div>
              <button type="submit" className="inline-flex items-center gap-1 rounded-lg border border-brand-600 px-3 py-1.5 text-xs font-semibold text-brand-700">
                <Plus className="h-3.5 w-3.5" /> Add Experience
              </button>
            </div>
            <ul className="mt-3 space-y-1 text-xs text-slate-600">
              {experiences.map((ex) => (
                <li key={ex.id}>• <strong>{ex.job_title}</strong> at {ex.company_name}</li>
              ))}
            </ul>
          </form>
        </div>
      </div>

      {enquiries.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">My Recruitment Enquiries ({enquiries.length})</h2>
          <div className="mt-3 space-y-2 text-xs">
            {enquiries.map((enq) => (
              <div key={enq.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{enq.subject}</span>
                  <StatusBadge status={enq.status} />
                </div>
                <p className="mt-1 text-slate-600">{enq.message}</p>
                {enq.employer_reply ? (
                  <p className="mt-1.5 text-emerald-700"><strong>Employer Reply:</strong> {enq.employer_reply}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
