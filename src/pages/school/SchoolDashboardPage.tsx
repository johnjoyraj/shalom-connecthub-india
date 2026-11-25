import { BookOpen, Briefcase, Building2, GraduationCap, MessageSquare, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LocationPicker } from '../../components/common/LocationPicker';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ErrorBanner, LoadingState, SuccessBanner } from '../../components/common/StateViews';
import { useAuth } from '../../context/AuthContext';
import { INDIA_LOCATIONS_SEED } from '../../data/indiaLocationsSeed';
import { DEFAULT_PRICING_TIERS } from '../../data/platformDefaults';
import { INSTITUTION_TYPE_LABELS, schoolStore } from '../../services/schoolStore';
import type {
  AdmissionEnquiry,
  AdmissionEnquiryStatus,
  BoardAffiliation,
  InstitutionType,
  SchoolClass,
  SchoolFacility,
  SchoolProfile,
  SchoolStaffVacancy,
} from '../../types/school';
import type { EmploymentType } from '../../types/staff';

export type SchoolDashboardTab = 'overview' | 'profile' | 'admissions' | 'vacancies' | 'enquiries';

export function SchoolDashboardPage({ tab }: { tab: SchoolDashboardTab }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [facilities, setFacilities] = useState<SchoolFacility[]>([]);
  const [enquiries, setEnquiries] = useState<AdmissionEnquiry[]>([]);
  const [vacancies, setVacancies] = useState<SchoolStaffVacancy[]>([]);

  // School Profile Form
  const [instType, setInstType] = useState<InstitutionType>('SCHOOL');
  const [name, setName] = useState('');
  const [board, setBoard] = useState<BoardAffiliation>('CBSE');
  const [affNo, setAffNo] = useState('');
  const [locationId, setLocationId] = useState<string | null>('loc-city-in-up-gorakhpur');
  const [pincode, setPincode] = useState('273001');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');
  const [admissionsOpen, setAdmissionsOpen] = useState(true);

  // Add Class & Facility State
  const [className, setClassName] = useState('');
  const [streamLevel, setStreamLevel] = useState('');
  const [annualFee, setAnnualFee] = useState('');
  const [facilityLabel, setFacilityLabel] = useState('');

  // Add Staff Vacancy State
  const [staffCategory, setStaffCategory] = useState<'TEACHING' | 'NON_TEACHING'>('TEACHING');
  const [vacTitle, setVacTitle] = useState('');
  const [vacDept, setVacDept] = useState('');
  const [vacQual, setVacQual] = useState('Graduate');
  const [vacType, setVacType] = useState<EmploymentType>('FULL_TIME');
  const [vacSalary, setVacSalary] = useState('');

  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const loadWorkspace = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const ws = await schoolStore.getMySchoolWorkspace(user);
      setSchool(ws.school);
      setClasses(ws.classes);
      setFacilities(ws.facilities);
      setEnquiries(ws.enquiries);
      setVacancies(ws.vacancies);
      if (ws.school) {
        setInstType(ws.school.institution_type);
        setName(ws.school.name);
        setBoard(ws.school.board_affiliation);
        setAffNo(ws.school.affiliation_number ?? '');
        setLocationId(ws.school.location_id);
        setPincode(ws.school.pincode ?? '');
        setContactEmail(ws.school.contact_email ?? '');
        setContactPhone(ws.school.contact_phone ?? '');
        setDescription(ws.school.description);
        setAdmissionsOpen(ws.school.admissions_open);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load school workspace.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  if (!user) return null;

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      const locNode = INDIA_LOCATIONS_SEED.find((l) => l.id === locationId);
      const stateNode = INDIA_LOCATIONS_SEED.find(
        (l) => l.level === 'STATE' && l.state_code === locNode?.state_code
      );
      const saved = await schoolStore.upsertMySchool(user, {
        institution_type: instType,
        name,
        board_affiliation: board,
        affiliation_number: affNo || undefined,
        medium_of_instruction: ['English'],
        location_id: locationId,
        state_name: stateNode?.name ?? 'India',
        city_name: locNode?.name ?? 'City',
        pincode: pincode || null,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        description,
        admissions_open: admissionsOpen,
      });
      setNotice(`Institution profile "${saved.name}" saved.`);
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save institution profile.');
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'
    }`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-950 px-6 py-5 text-white">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-saffron-500">
            Module C · School Administrator Portal
          </span>
          <h1 className="text-2xl font-extrabold">{school?.name ?? 'Register Your Institution'}</h1>
        </div>
        {school ? (
          <Link to={`/schools/${school.slug}`} className="rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold hover:bg-white/20">
            View Public School Profile →
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <nav className="space-y-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <NavLink to="/school-dashboard" end className={navLinkClass}><GraduationCap className="h-4 w-4" /> Overview</NavLink>
            <NavLink to="/school-dashboard/profile" className={navLinkClass}><Building2 className="h-4 w-4" /> School Profile &amp; Classes</NavLink>
            <NavLink to="/school-dashboard/admissions" className={navLinkClass}><BookOpen className="h-4 w-4" /> Admissions ({enquiries.length})</NavLink>
            <NavLink to="/school-dashboard/vacancies" className={navLinkClass}><Briefcase className="h-4 w-4" /> Staff Recruitment ({vacancies.length})</NavLink>
            <NavLink to="/school-dashboard/enquiries" className={navLinkClass}><MessageSquare className="h-4 w-4" /> Enquiries &amp; Plans</NavLink>
          </nav>
        </aside>

        <div className="space-y-6 lg:col-span-9">
          {error ? <ErrorBanner message={error} /> : null}
          {notice ? <SuccessBanner message={notice} /> : null}

          {loading ? (
            <LoadingState label="Loading School Administrator Dashboard..." />
          ) : tab === 'overview' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Classes / Programs</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">{classes.length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Campus Facilities</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">{facilities.length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Admission Enquiries</p>
                  <p className="mt-1 text-2xl font-extrabold text-brand-700">{enquiries.length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Staff Vacancies</p>
                  <p className="mt-1 text-2xl font-extrabold text-emerald-700">{vacancies.length}</p>
                </div>
              </div>
              {!school ? (
                <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6">
                  <h2 className="text-lg font-bold text-slate-900">Complete Your Institution Registration</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Register your school, college, preschool, tuition centre, or coaching institute under Profile.
                  </p>
                  <Link to="/school-dashboard/profile" className="mt-3 inline-block rounded-lg bg-brand-700 px-4 py-2 text-xs font-semibold text-white">
                    Setup School Profile
                  </Link>
                </div>
              ) : null}
            </div>
          ) : tab === 'profile' ? (
            <div className="space-y-6">
              <form onSubmit={handleSaveSchool} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Institution Profile &amp; Affiliation</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <select
                    value={instType}
                    onChange={(e) => setInstType(e.target.value as InstitutionType)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    {(Object.keys(INSTITUTION_TYPE_LABELS) as InstitutionType[]).map((t) => (
                      <option key={t} value={t}>{INSTITUTION_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                  <select
                    value={board}
                    onChange={(e) => setBoard(e.target.value as BoardAffiliation)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="STATE_BOARD">State Board</option>
                    <option value="IB">IB</option>
                    <option value="CAMBRIDGE">Cambridge</option>
                    <option value="NIOS">NIOS</option>
                    <option value="UNIVERSITY">University</option>
                    <option value="AUTONOMOUS">Autonomous</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <input
                    type="text"
                    value={affNo}
                    onChange={(e) => setAffNo(e.target.value)}
                    placeholder="Affiliation / Reg No."
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Official Institution Name"
                  className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Admissions Email"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Admissions Phone"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="PIN Code"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe academic focus, campus highlights, and co-curricular strengths..."
                  className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />

                <div className="mt-3">
                  <LocationPicker locations={INDIA_LOCATIONS_SEED} value={locationId} onChange={setLocationId} label="Campus Location" />
                </div>

                <label className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input type="checkbox" checked={admissionsOpen} onChange={(e) => setAdmissionsOpen(e.target.checked)} />
                  <span>Admissions Currently Open</span>
                </label>

                <button type="submit" className="mt-4 rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white">
                  Save School Profile
                </button>
              </form>

              {school ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await schoolStore.addSchoolClass(user, school.id, {
                        class_name: className,
                        stream_or_level: streamLevel || null,
                        age_or_eligibility: null,
                        annual_fee_approx: annualFee ? Number(annualFee) : null,
                        seats_available: null,
                      });
                      setClassName('');
                      setStreamLevel('');
                      setAnnualFee('');
                      setNotice('Class / Program added.');
                      await loadWorkspace();
                    }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <h3 className="text-base font-bold text-slate-900">Add Classes Offered</h3>
                    <div className="mt-3 space-y-2">
                      <input type="text" required value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Class / Program (e.g. Class I–V)" className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
                      <input type="text" value={streamLevel} onChange={(e) => setStreamLevel(e.target.value)} placeholder="Stream / Level (e.g. Primary)" className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
                      <input type="number" value={annualFee} onChange={(e) => setAnnualFee(e.target.value)} placeholder="Approx Annual Fee (₹)" className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
                      <button type="submit" className="inline-flex items-center gap-1 rounded-lg border border-brand-600 px-3 py-1.5 text-xs font-semibold text-brand-700">
                        <Plus className="h-3.5 w-3.5" /> Add Class
                      </button>
                    </div>
                  </form>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await schoolStore.addSchoolFacility(user, school.id, facilityLabel);
                      setFacilityLabel('');
                      setNotice('Facility added.');
                      await loadWorkspace();
                    }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <h3 className="text-base font-bold text-slate-900">Add Campus Facilities</h3>
                    <div className="mt-3 space-y-2">
                      <input type="text" required value={facilityLabel} onChange={(e) => setFacilityLabel(e.target.value)} placeholder="Facility (e.g. Robotics Lab, Library)" className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
                      <button type="submit" className="inline-flex items-center gap-1 rounded-lg border border-brand-600 px-3 py-1.5 text-xs font-semibold text-brand-700">
                        <Plus className="h-3.5 w-3.5" /> Add Facility
                      </button>
                    </div>
                    <ul className="mt-3 space-y-1 text-xs text-slate-600">
                      {facilities.map((f) => <li key={f.id}>• {f.facility_label}</li>)}
                    </ul>
                  </form>
                </div>
              ) : null}
            </div>
          ) : tab === 'admissions' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Admission Enquiries ({enquiries.length})</h2>
              <div className="mt-4 space-y-3">
                {enquiries.map((enq) => (
                  <div key={enq.id} className="rounded-xl border border-slate-200 p-4 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">
                        {enq.student_name} — Applying for {enq.applying_for_class} ({enq.academic_year})
                      </span>
                      <StatusBadge status={enq.status} />
                    </div>
                    <p className="mt-1 text-slate-500">Contact: {enq.contact_phone}</p>
                    <p className="mt-1.5 text-slate-700">{enq.message}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <input
                        type="text"
                        value={replyDrafts[enq.id] ?? ''}
                        onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [enq.id]: e.target.value }))}
                        placeholder="Admission counselling reply..."
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                      />
                      {(['CONTACTED', 'INTERVIEW_SCHEDULED', 'ADMITTED'] as AdmissionEnquiryStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={async () => {
                            await schoolStore.updateAdmissionEnquiry(user, enq.id, st, replyDrafts[enq.id] || `Marked ${st}`);
                            setNotice(`Admission enquiry moved to ${st}.`);
                            await loadWorkspace();
                          }}
                          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50"
                        >
                          {st.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : tab === 'vacancies' ? (
            <div className="space-y-6">
              {school ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await schoolStore.addSchoolVacancy(user, school.id, {
                      staff_category: staffCategory,
                      title: vacTitle,
                      subject_or_department: vacDept,
                      qualification_required: vacQual,
                      employment_type: vacType,
                      salary_range_label: vacSalary,
                    });
                    setVacTitle('');
                    setVacDept('');
                    setVacSalary('');
                    setNotice('School staff vacancy published.');
                    await loadWorkspace();
                  }}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h2 className="text-lg font-bold text-slate-900">Post Teaching / Non-Teaching Vacancy</h2>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <select value={staffCategory} onChange={(e) => setStaffCategory(e.target.value as 'TEACHING' | 'NON_TEACHING')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                      <option value="TEACHING">Teaching Staff</option>
                      <option value="NON_TEACHING">Non-Teaching Staff</option>
                    </select>
                    <input type="text" required value={vacTitle} onChange={(e) => setVacTitle(e.target.value)} placeholder="Role Title (e.g. TGT English, Bus Driver)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    <input type="text" required value={vacDept} onChange={(e) => setVacDept(e.target.value)} placeholder="Subject / Department" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    <input type="text" required value={vacQual} onChange={(e) => setVacQual(e.target.value)} placeholder="Qualification (e.g. B.Ed, Graduate)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    <select value={vacType} onChange={(e) => setVacType(e.target.value as EmploymentType)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                      <option value="FULL_TIME">Full-Time</option>
                      <option value="PART_TIME">Part-Time</option>
                      <option value="TEMPORARY">Temporary</option>
                      <option value="CONTRACT">Contract</option>
                    </select>
                    <input type="text" value={vacSalary} onChange={(e) => setVacSalary(e.target.value)} placeholder="Salary Range (e.g. ₹22k – ₹32k/mo)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </div>
                  <button type="submit" className="mt-4 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
                    Post School Vacancy
                  </button>
                </form>
              ) : null}

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900">Posted Vacancies ({vacancies.length})</h3>
                <div className="mt-3 space-y-2 text-xs">
                  {vacancies.map((v) => (
                    <div key={v.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                      <div>
                        <p className="font-bold text-slate-900">{v.title} ({v.staff_category})</p>
                        <p className="text-slate-500">{v.subject_or_department} · {v.qualification_required}</p>
                      </div>
                      <StatusBadge status={v.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">School Subscription Plans &amp; Enquiry Tracking</h2>
              <p className="mt-1 text-xs text-slate-600">
                Current Institution Plan: <strong>{school?.subscription_plan_code ?? 'FREE'}</strong> · Total Enquiries: <strong>{enquiries.length}</strong>
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {DEFAULT_PRICING_TIERS.slice(0, 3).map((tier) => (
                  <div key={tier.code} className="rounded-xl border border-slate-200 p-4">
                    <p className="font-bold text-slate-900">{tier.name}</p>
                    <p className="text-xl font-extrabold text-brand-700">₹{tier.monthly_inr}/mo</p>
                    <p className="mt-1 text-xs text-slate-500">Up to {tier.active_listings_limit} active institution listings</p>
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
