import { Award, MapPin, Search, Shield } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { LocationPicker } from '../../components/common/LocationPicker';
import { EmptyState, LoadingState } from '../../components/common/StateViews';
import { INDIA_LOCATIONS_SEED } from '../../data/indiaLocationsSeed';
import { formatLocationBreadcrumb } from '../../services/locationSearch';
import { staffStore } from '../../services/staffStore';
import type { CandidateProfile } from '../../types/staff';

export function CandidatesDirectoryPage() {
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [qualification, setQualification] = useState('ALL');
  const [skill, setSkill] = useState('');
  const [locationId, setLocationId] = useState<string | null>(null);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const list = await staffStore.searchCandidates({
        query,
        qualification,
        skill,
        locationId: locationId ?? undefined,
      });
      setCandidates(list);
    } finally {
      setLoading(false);
    }
  }, [query, qualification, skill, locationId]);

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Candidate Directory</h1>
          <p className="mt-1 text-sm text-slate-600">
            Search skills, qualifications, experience, and Indian locations. CVs remain strictly private until a candidate applies.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
          <Shield className="h-3.5 w-3.5" />
          <span>DPDPA CV Privacy Enforced</span>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void loadCandidates();
        }}
        className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Role, headline, or candidate name..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <select
            value={qualification}
            onChange={(e) => setQualification(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="ALL">Any Qualification</option>
            <option value="12th">12th</option>
            <option value="Diploma">Diploma</option>
            <option value="Graduate">Graduate</option>
            <option value="B.Tech">B.Tech</option>
            <option value="Postgraduate">Postgraduate</option>
            <option value="B.Ed">B.Ed</option>
          </select>
          <input
            type="text"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="Filter by skill (e.g. React, Mathematics)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="mt-3 grid grid-cols-1 items-end gap-3 sm:grid-cols-12">
          <div className="sm:col-span-9">
            <LocationPicker locations={INDIA_LOCATIONS_SEED} value={locationId} onChange={setLocationId} />
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Search Candidates
            </button>
          </div>
        </div>
      </form>

      {loading ? (
        <LoadingState label="Searching candidate profiles..." />
      ) : candidates.length === 0 ? (
        <EmptyState
          title="No searchable candidates match your filters"
          description="Try broadening your skill or location filter."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {candidates.map((cand) => (
            <article key={cand.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{cand.full_name}</h2>
                  <p className="text-xs font-medium text-brand-700">{cand.headline}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                  {cand.total_experience_years} yrs
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{cand.bio || 'Profile available for hiring.'}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {cand.skills.map((sk) => (
                  <span key={sk} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-medium text-brand-700">
                    {sk}
                  </span>
                ))}
              </div>

              <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-brand-600" />
                  <span>{cand.highest_qualification}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-brand-600" />
                  <span>{formatLocationBreadcrumb(cand.current_location_id, INDIA_LOCATIONS_SEED)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
