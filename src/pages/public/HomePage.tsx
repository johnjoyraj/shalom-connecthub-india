import { ArrowRight, Briefcase, Building2, CheckCircle2, GraduationCap, MapPin, Search, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LocationPicker } from '../../components/common/LocationPicker';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/common/StateViews';
import { formatLocationBreadcrumb } from '../../services/locationSearch';
import { platformStore } from '../../services/platformStore';
import type { Category, Listing, LocationNode, ModuleKey } from '../../types/domain';

export function HomePage() {
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [moduleKey, setModuleKey] = useState<ModuleKey | 'ALL'>('ALL');
  const [locationId, setLocationId] = useState<string | null>(null);
  const [pincode, setPincode] = useState('');

  useEffect(() => {
    let active = true;
    async function loadInitial() {
      try {
        const [locs, cats, items] = await Promise.all([
          platformStore.getLocations(false),
          platformStore.getCategories(true),
          platformStore.searchListings({}),
        ]);
        if (!active) return;
        setLocations(locs);
        setCategories(cats);
        setListings(items);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load marketplace data.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadInitial();
    return () => {
      active = false;
    };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const results = await platformStore.searchListings({
        query,
        moduleKey,
        locationId: locationId ?? undefined,
        pincode: pincode.trim() || undefined,
      });
      setListings(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const activeCategories = categories.filter((c) => c.is_enabled);
  const futureCategories = categories.filter((c) => c.is_future_module);

  return (
    <div>
      {/* Search-First Hero */}
      <section className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 px-4 py-12 text-white sm:px-6 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-brand-100">
            <Shield className="h-3.5 w-3.5 text-saffron-500" />
            <span>All-India Modular Service Marketplace · 28 States &amp; 8 Union Territories</span>
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Everything Connected. Opportunities Everywhere.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-brand-100 sm:text-base">
            One platform connecting people, employment, properties, schools, businesses and professional services across India.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-8 rounded-2xl bg-white p-4 text-slate-900 shadow-xl sm:p-6"
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-5">
                <label htmlFor="hero-search-query" className="mb-1 block text-xs font-medium text-slate-700">
                  Keyword (Job, Property, School, Service)
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    id="hero-search-query"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Full-Stack Engineer, 3 BHK Kochi, School..."
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="md:col-span-4">
                <label htmlFor="hero-module-select" className="mb-1 block text-xs font-medium text-slate-700">
                  Service Module
                </label>
                <select
                  id="hero-module-select"
                  value={moduleKey}
                  onChange={(e) => setModuleKey(e.target.value as ModuleKey | 'ALL')}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
                >
                  <option value="ALL">All Active Modules</option>
                  {activeCategories.map((cat) => (
                    <option key={cat.id} value={cat.module_key}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label htmlFor="hero-pincode" className="mb-1 block text-xs font-medium text-slate-700">
                  PIN Code (Optional)
                </label>
                <input
                  id="hero-pincode"
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 682001"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 items-end gap-3 md:grid-cols-12">
              <div className="md:col-span-9">
                <LocationPicker locations={locations} value={locationId} onChange={setLocationId} />
              </div>
              <div className="md:col-span-3">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
                >
                  <Search className="h-4 w-4" />
                  <span>Search India</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Initial Release Modules */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Initial Marketplace Hubs</h2>
            <p className="mt-1 text-sm text-slate-600">
              Built on one unified account, organisation, location, enquiry, and subscription engine.
            </p>
          </div>
          <Link to="/pricing" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            <span>View Plans from ₹0/mo</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
          <Link
            to="/staff"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-300 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Briefcase className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-brand-700">
              Module A: Staff Connect
            </h3>
            <p className="mt-1.5 text-sm text-slate-600">
              Employer &amp; candidate profiles, CVs, full-time/part-time/contract jobs, shortlisting, and recruitment enquiries.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
              Explore Staff Connect <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>

          <Link
            to="/properties"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-300 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-brand-700">
              Module B: Property Connect
            </h3>
            <p className="mt-1.5 text-sm text-slate-600">
              Rentals, apartments, commercial shops, hostels/PGs, plots, and land with address privacy controls &amp; visit requests.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
              Explore Property Connect <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>

          <Link
            to="/schools"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-300 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-brand-700">
              Module C: School Connect
            </h3>
            <p className="mt-1.5 text-sm text-slate-600">
              Schools, colleges, preschools, tuition &amp; coaching institutions — admissions, facilities, and teaching vacancies.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
              Explore School Connect <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      </section>

      {/* Search Results */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Approved Marketplace Listings</h2>
          <span className="text-xs font-medium text-slate-500">{listings.length} result(s)</span>
        </div>

        {error ? <ErrorBanner message={error} /> : null}
        {loading ? (
          <LoadingState label="Searching across India..." />
        ) : listings.length === 0 ? (
          <EmptyState
            title="No matching approved listings"
            description="Try clearing the PIN code or expanding your State/District filter to All India."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((item) => (
              <article
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold uppercase text-brand-700">
                      {item.module_key}
                    </span>
                    {item.is_featured ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        Featured
                      </span>
                    ) : (
                      <StatusBadge status={item.status} />
                    )}
                  </div>
                  <h3 className="mt-3 text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600">{item.summary}</p>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-brand-600" />
                    <span>{formatLocationBreadcrumb(item.location_id, locations)}</span>
                  </div>
                  <Link
                    to={`/listing/${item.slug}`}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                  >
                    <span>View Listing Details</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Configurable Future Modules Banner */}
      <section className="border-t border-slate-200 bg-white px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Modular Future Expansion Ready</h2>
              <p className="mt-1 text-sm text-slate-600">
                Administrators can enable additional vertical categories directly from the Control Centre without rebuilding the platform.
              </p>
            </div>
            <Link to="/admin/categories" className="text-sm font-semibold text-brand-700 hover:underline">
              Configure in Admin →
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {futureCategories.map((cat) => (
              <span
                key={cat.id}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                  cat.is_enabled
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                <CheckCircle2 className={`h-3.5 w-3.5 ${cat.is_enabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{cat.name}</span>
                <span className="text-[10px] uppercase text-slate-400">
                  {cat.is_enabled ? 'Active' : 'Admin Toggleable'}
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
