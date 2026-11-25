import { ArrowRight, BookOpen, GraduationCap, MapPin, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LocationPicker } from '../../components/common/LocationPicker';
import { EmptyState, LoadingState } from '../../components/common/StateViews';
import { INDIA_LOCATIONS_SEED } from '../../data/indiaLocationsSeed';
import { INSTITUTION_TYPE_LABELS, schoolStore } from '../../services/schoolStore';
import type { BoardAffiliation, InstitutionType, SchoolProfile } from '../../types/school';

const BOARDS: Array<BoardAffiliation | 'ALL'> = [
  'ALL',
  'CBSE',
  'ICSE',
  'STATE_BOARD',
  'IB',
  'CAMBRIDGE',
  'NIOS',
  'UNIVERSITY',
  'AUTONOMOUS',
  'OTHER',
];

export function SchoolsDirectoryPage() {
  const [schools, setSchools] = useState<SchoolProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [institutionType, setInstitutionType] = useState<InstitutionType | 'ALL'>('ALL');
  const [board, setBoard] = useState<BoardAffiliation | 'ALL'>('ALL');
  const [className, setClassName] = useState('');
  const [facility, setFacility] = useState('');
  const [pincode, setPincode] = useState('');
  const [admissionsOpenOnly, setAdmissionsOpenOnly] = useState(false);
  const [locationId, setLocationId] = useState<string | null>(null);

  const runSearch = useCallback(async () => {
    setLoading(true);
    try {
      const results = await schoolStore.searchSchools({
        query,
        institutionType,
        board,
        className: className || undefined,
        facility: facility || undefined,
        pincode: pincode || undefined,
        admissionsOpenOnly,
        locationId: locationId ?? undefined,
      });
      setSchools(results);
    } finally {
      setLoading(false);
    }
  }, [query, institutionType, board, className, facility, pincode, admissionsOpenOnly, locationId]);

  useEffect(() => {
    void runSearch();
  }, [runSearch]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            Module C · School Connect
          </span>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            Schools, Colleges, Preschools &amp; Coaching Across India
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Search institutions by board, classes offered, facilities, admissions status, and Indian location.
          </p>
        </div>
        <Link
          to="/school-dashboard/profile"
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          Register Institution
        </Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runSearch();
        }}
        className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-700">Institution Name / Keyword</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="School, College, Montessori, JEE..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Institution Type</label>
            <select
              aria-label="Institution Type"
              value={institutionType}
              onChange={(e) => setInstitutionType(e.target.value as InstitutionType | 'ALL')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="ALL">All Institutions</option>
              {(Object.keys(INSTITUTION_TYPE_LABELS) as InstitutionType[]).map((t) => (
                <option key={t} value={t}>{INSTITUTION_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Board / Affiliation</label>
            <select
              aria-label="Board Affiliation"
              value={board}
              onChange={(e) => setBoard(e.target.value as BoardAffiliation | 'ALL')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {BOARDS.map((b) => (
                <option key={b} value={b}>{b === 'ALL' ? 'All Boards' : b.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Class / Program</label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g. Nursery, Class XI"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Facility</label>
            <input
              type="text"
              value={facility}
              onChange={(e) => setFacility(e.target.value)}
              placeholder="e.g. Labs, Transport"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 items-end gap-3 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <LocationPicker locations={INDIA_LOCATIONS_SEED} value={locationId} onChange={setLocationId} />
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-700">PIN Code</label>
            <input
              type="text"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 273001"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center pb-2 lg:col-span-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={admissionsOpenOnly}
                onChange={(e) => setAdmissionsOpenOnly(e.target.checked)}
              />
              <span>Admissions Open</span>
            </label>
          </div>
          <div className="lg:col-span-2">
            <button
              type="submit"
              className="w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Search Schools
            </button>
          </div>
        </div>
      </form>

      {loading ? (
        <LoadingState label="Searching educational institutions..." />
      ) : schools.length === 0 ? (
        <EmptyState
          title="No institutions match your filters"
          description="Try widening the board, facility, or location filter."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {schools.map((sch) => (
            <article key={sch.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                    {INSTITUTION_TYPE_LABELS[sch.institution_type]}
                  </span>
                  {sch.admissions_open ? (
                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold text-brand-700">
                      Admissions Open
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-3 text-base font-bold text-slate-900">{sch.name}</h2>
                <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-slate-500">
                  <BookOpen className="h-3.5 w-3.5 text-brand-600" />
                  <span>{sch.board_affiliation.replace('_', ' ')} · {sch.medium_of_instruction.join(', ')}</span>
                </p>
                <p className="mt-2 text-sm text-slate-600">{sch.description}</p>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="flex items-center gap-1.5 text-xs text-slate-600">
                  <MapPin className="h-3.5 w-3.5 text-brand-600" />
                  <span>{sch.city_name}, {sch.state_name} {sch.pincode ? `(${sch.pincode})` : ''}</span>
                </p>
                <Link
                  to={`/schools/${sch.slug}`}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-800"
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>View Profile &amp; Enquire</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
