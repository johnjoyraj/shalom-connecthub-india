import { Building2, IndianRupee, MapPin, Maximize2, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LocationPicker } from '../../components/common/LocationPicker';
import { EmptyState, LoadingState } from '../../components/common/StateViews';
import { useAuth } from '../../context/AuthContext';
import { INDIA_LOCATIONS_SEED } from '../../data/indiaLocationsSeed';
import { AREA_UNIT_LABELS, PROPERTY_TYPE_LABELS } from '../../services/propertyFormRules';
import { getDisplayAddress, propertyStore } from '../../services/propertyStore';
import type { PropertyListing, PropertyPurpose, PropertyType } from '../../types/property';

export function PropertiesDirectoryPage({
  preset = 'ALL',
}: {
  preset?: 'ALL' | 'RENTALS' | 'SALES' | 'LAND';
}) {
  const { user } = useAuth();
  const [items, setItems] = useState<PropertyListing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType | 'ALL'>(
    preset === 'LAND' ? 'RESIDENTIAL_PLOT' : 'ALL'
  );
  const [purpose, setPurpose] = useState<PropertyPurpose | 'ALL'>(
    preset === 'RENTALS' ? 'RENT' : preset === 'SALES' ? 'SALE' : 'ALL'
  );
  const [maxPrice, setMaxPrice] = useState('');
  const [minBedrooms, setMinBedrooms] = useState('');
  const [amenity, setAmenity] = useState('');
  const [pincode, setPincode] = useState('');
  const [locationId, setLocationId] = useState<string | null>(null);

  useEffect(() => {
    setPropertyType(preset === 'LAND' ? 'RESIDENTIAL_PLOT' : 'ALL');
    setPurpose(preset === 'RENTALS' ? 'RENT' : preset === 'SALES' ? 'SALE' : 'ALL');
  }, [preset]);

  const runSearch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await propertyStore.searchProperties({
        query,
        propertyType:
          preset === 'LAND' && propertyType === 'ALL' ? 'ALL' : propertyType,
        purpose,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        minBedrooms: minBedrooms ? Number(minBedrooms) : undefined,
        amenity: amenity || undefined,
        pincode: pincode || undefined,
        locationId: locationId ?? undefined,
      });
      const finalItems =
        preset === 'LAND' && propertyType === 'ALL'
          ? res.items.filter(
              (p) => p.property_type === 'RESIDENTIAL_PLOT' || p.property_type === 'AGRICULTURAL_LAND'
            )
          : res.items;
      setItems(finalItems);
      setTotal(finalItems.length);
    } finally {
      setLoading(false);
    }
  }, [query, propertyType, purpose, maxPrice, minBedrooms, amenity, pincode, locationId, preset]);

  useEffect(() => {
    void runSearch();
  }, [runSearch]);

  const heading =
    preset === 'RENTALS'
      ? 'Rentals, Flats & PG / Hostels Across India'
      : preset === 'SALES'
      ? 'Property Sales & Resale Across India'
      : preset === 'LAND'
      ? 'Residential Plots & Agricultural Land'
      : 'Property Connect — Homes, Commercial & Land';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            Module B · Property Connect
          </span>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">{heading}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Search verified owner and authorised agent listings with address privacy controls.
          </p>
        </div>
        <Link
          to="/owner/properties"
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          List a Property
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
            <label className="mb-1 block text-xs font-medium text-slate-700">Keyword / Locality</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Apartment, Kochi, Shop, PG..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Property Type</label>
            <select
              aria-label="Property Type"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as PropertyType | 'ALL')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="ALL">All Types</option>
              {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((t) => (
                <option key={t} value={t}>
                  {PROPERTY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Purpose</label>
            <select
              aria-label="Purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as PropertyPurpose | 'ALL')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="ALL">Rent / Sale / Lease</option>
              <option value="RENT">For Rent / PG</option>
              <option value="SALE">For Sale / Resale</option>
              <option value="LEASE">Land / Commercial Lease</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Max Price / Rent (₹)</label>
            <input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="e.g. 35000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">PIN Code</label>
            <input
              type="text"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 682001"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 items-end gap-3 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <LocationPicker locations={INDIA_LOCATIONS_SEED} value={locationId} onChange={setLocationId} />
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-700">Min Bedrooms</label>
            <input
              type="number"
              min={0}
              value={minBedrooms}
              onChange={(e) => setMinBedrooms(e.target.value)}
              placeholder="Any"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-700">Amenity</label>
            <input
              type="text"
              value={amenity}
              onChange={(e) => setAmenity(e.target.value)}
              placeholder="Parking, Wi-Fi..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="lg:col-span-2">
            <button
              type="submit"
              className="w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Search Properties
            </button>
          </div>
        </div>
      </form>

      {loading ? (
        <LoadingState label="Searching properties across India..." />
      ) : items.length === 0 ? (
        <EmptyState
          title="No properties match your filters"
          description="Try adjusting the price cap, property type, or Indian city/state filter."
        />
      ) : (
        <>
          <p className="mb-3 text-xs font-medium text-slate-500">{total} active property listing(s)</p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((prop) => (
              <article key={prop.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                      {PROPERTY_TYPE_LABELS[prop.property_type]} · {prop.purpose}
                    </span>
                    {prop.is_featured ? (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                        Featured
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-3 text-base font-bold text-slate-900">{prop.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{prop.description}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {prop.amenities.slice(0, 4).map((am) => (
                      <span key={am} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                        {am}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {prop.purpose === 'SALE' ? (
                      <span>₹{(prop.sale_price ?? 0).toLocaleString('en-IN')} {prop.is_resale ? '(Resale)' : ''}</span>
                    ) : (
                      <span>₹{(prop.monthly_rent ?? 0).toLocaleString('en-IN')} / month</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Maximize2 className="h-3.5 w-3.5 text-brand-600" />
                    <span>
                      {prop.area_value} {AREA_UNIT_LABELS[prop.area_unit]}
                      {prop.bedrooms !== null ? ` · ${prop.bedrooms} BHK` : ''}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                    <span>{getDisplayAddress(prop, user)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                      <Building2 className="h-3.5 w-3.5" /> {prop.lister_role === 'OWNER' ? 'Owner' : 'Authorised Agent'}
                    </span>
                    <Link
                      to={`/listing/${prop.slug}`}
                      className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800"
                    >
                      View &amp; Enquire
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
