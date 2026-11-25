import { BookOpen, Briefcase, CheckCircle2, Globe, Mail, MapPin, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState, ErrorBanner, LoadingState, SuccessBanner } from '../../components/common/StateViews';
import { useAuth } from '../../context/AuthContext';
import { INSTITUTION_TYPE_LABELS, schoolStore } from '../../services/schoolStore';
import type {
  SchoolClass,
  SchoolFacility,
  SchoolGalleryItem,
  SchoolProfile,
  SchoolStaffVacancy,
} from '../../types/school';

export function SchoolProfilePage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [facilities, setFacilities] = useState<SchoolFacility[]>([]);
  const [vacancies, setVacancies] = useState<SchoolStaffVacancy[]>([]);
  const [gallery, setGallery] = useState<SchoolGalleryItem[]>([]);

  const [studentName, setStudentName] = useState('');
  const [applyingClass, setApplyingClass] = useState('');
  const [academicYear, setAcademicYear] = useState('2027-28');
  const [contactPhone, setContactPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    void schoolStore.getSchoolDetailsBySlug(slug).then((data) => {
      if (data) {
        setSchool(data.school);
        setClasses(data.classes);
        setFacilities(data.facilities);
        setVacancies(data.vacancies);
        setGallery(data.gallery);
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <LoadingState label="Loading institution profile..." />;
  if (!school) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          title="Institution Not Found"
          description="This institution profile may have been paused or removed."
          action={<Link to="/schools" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">Browse Schools</Link>}
        />
      </div>
    );
  }

  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await schoolStore.submitAdmissionEnquiry(user, {
        schoolId: school.id,
        studentName,
        applyingForClass: applyingClass,
        academicYear,
        contactPhone,
        message,
      });
      setStudentName('');
      setApplyingClass('');
      setContactPhone('');
      setMessage('');
      setNotice(`Admission enquiry submitted to ${school.name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit admission enquiry.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6">
      {error ? <ErrorBanner message={error} /> : null}
      {notice ? <SuccessBanner message={notice} /> : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
            {INSTITUTION_TYPE_LABELS[school.institution_type]} · {school.board_affiliation.replace('_', ' ')}
          </span>
          {school.admissions_open ? (
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
              Admissions Open
            </span>
          ) : null}
        </div>

        <h1 className="mt-3 text-3xl font-extrabold text-slate-900">{school.name}</h1>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
          <MapPin className="h-4 w-4 text-brand-600" />
          <span>{school.city_name}, {school.state_name} {school.pincode ? `(${school.pincode})` : ''}</span>
        </p>

        <p className="mt-4 text-sm leading-relaxed text-slate-700">{school.description}</p>

        <div className="mt-5 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 text-xs text-slate-700 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-brand-600" />
            <span>Affiliation: {school.affiliation_number || school.board_affiliation}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-brand-600" />
            <span>{school.contact_phone || 'Available on enquiry'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-brand-600" />
            <span>{school.contact_email || 'admissions@shalomconnecthub.in'}</span>
          </div>
        </div>
        {school.website ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-brand-700">
            <Globe className="h-3.5 w-3.5" /> <span>{school.website}</span>
          </p>
        ) : null}
      </div>

      {/* Classes & Facilities */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Classes &amp; Programs Offered ({classes.length})</h2>
          <div className="mt-4 space-y-2.5 text-xs">
            {classes.map((cls) => (
              <div key={cls.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{cls.class_name}</span>
                  {cls.annual_fee_approx ? <span>~₹{cls.annual_fee_approx.toLocaleString('en-IN')}/yr</span> : null}
                </div>
                <p className="mt-0.5 text-slate-600">
                  {cls.stream_or_level ?? ''} {cls.seats_available ? `· ${cls.seats_available} seats` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Campus Facilities ({facilities.length})</h2>
          <div className="mt-4 space-y-2.5 text-xs">
            {facilities.map((fac) => (
              <div key={fac.id} className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-bold text-slate-900">{fac.facility_label}</p>
                  {fac.description ? <p className="text-slate-600">{fac.description}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Teaching & Non-Teaching Vacancies */}
      {vacancies.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-brand-700">
            <Briefcase className="h-5 w-5" />
            <h2 className="text-lg font-bold text-slate-900">Teaching &amp; Non-Teaching Recruitment ({vacancies.length})</h2>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {vacancies.map((vac) => (
              <div key={vac.id} className="rounded-xl border border-slate-200 p-4 text-xs">
                <span className="rounded bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                  {vac.staff_category.replace('_', ' ')} · {vac.employment_type.replace('_', ' ')}
                </span>
                <p className="mt-2 text-sm font-bold text-slate-900">{vac.title}</p>
                <p className="mt-0.5 text-slate-600">{vac.subject_or_department} · {vac.qualification_required}</p>
                {vac.salary_range_label ? (
                  <p className="mt-1 font-semibold text-emerald-700">{vac.salary_range_label}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Gallery */}
      {gallery.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Campus Gallery ({gallery.length})</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {gallery.map((g) => (
              <div key={g.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs">
                <p className="font-semibold text-slate-900">{g.caption}</p>
                <p className="mt-0.5 text-slate-500">Asset: {g.storage_path}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Admission Enquiry Form */}
      <form onSubmit={handleAdmissionSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Submit Admission Enquiry</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="text"
            required
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Student Full Name"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            required
            value={applyingClass}
            onChange={(e) => setApplyingClass(e.target.value)}
            placeholder="Applying for Class / Course (e.g. Class VI)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="Academic Year (e.g. 2027-28)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="tel"
            required
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="Parent / Student Phone (+91...)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <textarea
          rows={3}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Questions on fees, transport, hostel, or admission schedule..."
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="mt-3 rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800">
          Submit Admission Enquiry
        </button>
      </form>
    </div>
  );
}
