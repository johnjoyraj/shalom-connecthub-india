import { Building2, CreditCard, FileText, Home, MessageSquare, Plus, ShieldAlert } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LocationPicker } from '../../components/common/LocationPicker';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ErrorBanner, LoadingState, SuccessBanner } from '../../components/common/StateViews';
import { useAuth } from '../../context/AuthContext';
import { INDIA_LOCATIONS_SEED } from '../../data/indiaLocationsSeed';
import { DEFAULT_PRICING_TIERS } from '../../data/platformDefaults';
import { AREA_UNIT_LABELS, getPropertyFormConfig, PROPERTY_TYPE_LABELS } from '../../services/propertyFormRules';
import { NON_LEGAL_TITLE_DISCLAIMER, propertyStore } from '../../services/propertyStore';
import type {
  AddressPrivacy,
  AreaUnit,
  FurnishingType,
  PropertyDocument,
  PropertyEnquiry,
  PropertyEnquiryStatus,
  PropertyListing,
  PropertyPurpose,
  PropertyType,
} from '../../types/property';

export type OwnerTab = 'overview' | 'properties' | 'enquiries' | 'documents' | 'subscription';

export function OwnerDashboardPage({ tab }: { tab: OwnerTab }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [enquiries, setEnquiries] = useState<PropertyEnquiry[]>([]);
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // Dynamic Form State
  const [propertyType, setPropertyType] = useState<PropertyType>('APARTMENT_FLAT');
  const [purpose, setPurpose] = useState<PropertyPurpose>('RENT');
  const [isResale, setIsResale] = useState(false);
  const [listerRole, setListerRole] = useState<'OWNER' | 'AUTHORISED_AGENT'>('OWNER');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationId, setLocationId] = useState<string | null>('loc-city-in-kl-kochi');
  const [locality, setLocality] = useState('');
  const [pincode, setPincode] = useState('682001');
  const [fullAddress, setFullAddress] = useState('');
  const [addressPrivacy, setAddressPrivacy] = useState<AddressPrivacy>('CITY_LOCALITY_ONLY');
  const [areaValue, setAreaValue] = useState('1200');
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('SQ_FT');
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('2');
  const [furnishing, setFurnishing] = useState<FurnishingType>('SEMI_FURNISHED');
  const [pgSharing, setPgSharing] = useState('2-Sharing');
  const [mealsIncluded, setMealsIncluded] = useState(true);
  const [genderPref, setGenderPref] = useState<'ANY' | 'MALE' | 'FEMALE'>('ANY');
  const [salePrice, setSalePrice] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('22000');
  const [deposit, setDeposit] = useState('60000');
  const [leaseMonths, setLeaseMonths] = useState('36');
  const [amenitiesText, setAmenitiesText] = useState('Parking, Security');

  // Document Upload State
  const [docPropId, setDocPropId] = useState('');
  const [docType, setDocType] = useState<PropertyDocument['document_type']>('TAX_RECEIPT');
  const [docFileName, setDocFileName] = useState('');

  const formConfig = useMemo(
    () => getPropertyFormConfig(propertyType, purpose),
    [propertyType, purpose]
  );

  useEffect(() => {
    if (!formConfig.allowedPurposes.includes(purpose)) {
      setPurpose(formConfig.allowedPurposes[0]);
    }
    if (!formConfig.allowedAreaUnits.includes(areaUnit)) {
      setAreaUnit(formConfig.defaultAreaUnit);
    }
  }, [formConfig, purpose, areaUnit]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [props, enqs, docs] = await Promise.all([
        propertyStore.getManagedProperties(user),
        propertyStore.getPropertyEnquiries(user),
        propertyStore.getPropertyDocuments(user),
      ]);
      setProperties(props);
      setEnquiries(enqs.filter((e) => e.owner_id === user.profile.id || e.authorised_agent_id === user.profile.id));
      setDocuments(docs);
      if (props.length > 0 && !docPropId) {
        setDocPropId(props[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Property Owner workspace.');
    } finally {
      setLoading(false);
    }
  }, [user, docPropId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (!user) return null;

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      const locNode = INDIA_LOCATIONS_SEED.find((l) => l.id === locationId);
      const stateNode = INDIA_LOCATIONS_SEED.find(
        (l) => l.level === 'STATE' && l.state_code === locNode?.state_code
      );
      const created = await propertyStore.createPropertyListing(user, {
        title,
        description,
        property_type: propertyType,
        purpose,
        is_resale: formConfig.showResaleToggle ? isResale : false,
        lister_role: listerRole,
        location_id: locationId,
        state_name: stateNode?.name ?? 'India',
        district_name: locNode?.name ?? 'District',
        city_name: locNode?.name ?? 'City',
        pincode,
        locality,
        full_address: fullAddress,
        address_privacy: addressPrivacy,
        area_value: Number(areaValue),
        area_unit: areaUnit,
        bedrooms: formConfig.showBedroomsBathrooms ? Number(bedrooms) : null,
        bathrooms: formConfig.showBedroomsBathrooms ? Number(bathrooms) : null,
        furnishing: formConfig.showFurnishing ? furnishing : null,
        pg_sharing_type: formConfig.showPgFields ? pgSharing : null,
        meals_included: formConfig.showPgFields ? mealsIncluded : null,
        gender_preference: formConfig.showPgFields ? genderPref : null,
        sale_price: formConfig.showSalePrice ? Number(salePrice) || null : null,
        monthly_rent: formConfig.showRentAndDeposit ? Number(monthlyRent) || null : null,
        security_deposit: formConfig.showRentAndDeposit ? Number(deposit) || null : null,
        lease_duration_months: formConfig.showLeaseDuration ? Number(leaseMonths) || null : null,
        is_negotiable: true,
        amenities: amenitiesText.split(',').map((a) => a.trim()).filter(Boolean),
      });
      setTitle('');
      setDescription('');
      setFullAddress('');
      setNotice(`Property "${created.title}" published.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create property.');
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docPropId) return;
    setError(null);
    try {
      await propertyStore.uploadPropertyDocument(user, docPropId, {
        document_type: docType,
        file_name: docFileName.trim() || 'Supporting_Document.pdf',
      });
      setDocFileName('');
      setNotice('Document submitted for moderation review (note: does not verify legal title).');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit document.');
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'
    }`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 px-6 py-5 text-white">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-saffron-500">
            Module B · Property Owner &amp; Authorised Agent Portal
          </span>
          <h1 className="text-2xl font-extrabold">Property Management &amp; Visit Requests</h1>
        </div>
        <Link to="/properties" className="rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold hover:bg-white/20">
          Browse Property Connect →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <nav className="space-y-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <NavLink to="/owner" end className={navLinkClass}><Home className="h-4 w-4" /> Overview</NavLink>
            <NavLink to="/owner/properties" className={navLinkClass}><Plus className="h-4 w-4" /> My Properties ({properties.length})</NavLink>
            <NavLink to="/owner/enquiries" className={navLinkClass}><MessageSquare className="h-4 w-4" /> Enquiries &amp; Visits ({enquiries.length})</NavLink>
            <NavLink to="/owner/documents" className={navLinkClass}><FileText className="h-4 w-4" /> Documents ({documents.length})</NavLink>
            <NavLink to="/owner/subscription" className={navLinkClass}><CreditCard className="h-4 w-4" /> Subscriptions</NavLink>
          </nav>
        </aside>

        <div className="space-y-6 lg:col-span-9">
          {error ? <ErrorBanner message={error} /> : null}
          {notice ? <SuccessBanner message={notice} /> : null}

          {loading ? (
            <LoadingState label="Loading Property Workspace..." />
          ) : tab === 'overview' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Managed Properties</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">{properties.length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Buyer / Tenant / Visit Enquiries</p>
                  <p className="mt-1 text-2xl font-extrabold text-brand-700">{enquiries.length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Submitted Documents</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">{documents.length}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Your Authorised Property Portfolio</h2>
                <div className="mt-4 space-y-3">
                  {properties.map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-4">
                      <div>
                        <p className="font-bold text-slate-900">{p.title}</p>
                        <p className="text-xs text-slate-500">
                          {PROPERTY_TYPE_LABELS[p.property_type]} · {p.purpose} · Expires {new Date(p.expires_at).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : tab === 'properties' ? (
            <div className="space-y-6">
              <form onSubmit={handleCreateProperty} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-brand-700">
                  <Building2 className="h-5 w-5" />
                  <h2 className="text-lg font-bold text-slate-900">List a Property (Dynamic Form)</h2>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">Property Type</label>
                    <select
                      aria-label="Property Type Form"
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((t) => (
                        <option key={t} value={t}>{PROPERTY_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">Purpose</label>
                    <select
                      aria-label="Property Purpose Form"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value as PropertyPurpose)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      {formConfig.allowedPurposes.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">Listing As</label>
                    <select
                      value={listerRole}
                      onChange={(e) => setListerRole(e.target.value as 'OWNER' | 'AUTHORISED_AGENT')}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="OWNER">Property Owner</option>
                      <option value="AUTHORISED_AGENT">Authorised Agent</option>
                    </select>
                  </div>
                </div>

                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Property Headline (e.g. 2 BHK Independent House in Ernakulam)"
                  className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />

                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe property condition, connectivity, water/power availability..."
                  className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />

                {/* Dynamic Measurement & Room Fields */}
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">Area</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      value={areaValue}
                      onChange={(e) => setAreaValue(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">Unit</label>
                    <select
                      value={areaUnit}
                      onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      {formConfig.allowedAreaUnits.map((u) => (
                        <option key={u} value={u}>{AREA_UNIT_LABELS[u]}</option>
                      ))}
                    </select>
                  </div>

                  {formConfig.showBedroomsBathrooms ? (
                    <>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Bedrooms</label>
                        <input
                          type="number"
                          min="0"
                          value={bedrooms}
                          onChange={(e) => setBedrooms(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Bathrooms</label>
                        <input
                          type="number"
                          min="0"
                          value={bathrooms}
                          onChange={(e) => setBathrooms(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </>
                  ) : null}
                </div>

                {formConfig.showPgFields ? (
                  <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-3">
                    <input
                      type="text"
                      value={pgSharing}
                      onChange={(e) => setPgSharing(e.target.value)}
                      placeholder="Sharing type (Single / 2-Sharing)"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                    <select
                      value={genderPref}
                      onChange={(e) => setGenderPref(e.target.value as 'ANY' | 'MALE' | 'FEMALE')}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="ANY">Any Gender</option>
                      <option value="FEMALE">Women / Girls Only</option>
                      <option value="MALE">Men / Boys Only</option>
                    </select>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <input type="checkbox" checked={mealsIncluded} onChange={(e) => setMealsIncluded(e.target.checked)} />
                      <span>Meals Included</span>
                    </label>
                  </div>
                ) : null}

                {/* Dynamic Pricing Fields */}
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {formConfig.showSalePrice ? (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">Sale Price (₹)</label>
                      <input
                        type="number"
                        required
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                        placeholder="e.g. 4500000"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  ) : null}
                  {formConfig.showRentAndDeposit ? (
                    <>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Monthly Rent / Fee (₹)</label>
                        <input
                          type="number"
                          required
                          value={monthlyRent}
                          onChange={(e) => setMonthlyRent(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Security Deposit (₹)</label>
                        <input
                          type="number"
                          value={deposit}
                          onChange={(e) => setDeposit(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </>
                  ) : null}
                  {formConfig.showLeaseDuration ? (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">Lease Duration (Months)</label>
                      <input
                        type="number"
                        value={leaseMonths}
                        onChange={(e) => setLeaseMonths(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  ) : null}
                  {formConfig.showFurnishing ? (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">Furnishing</label>
                      <select
                        value={furnishing}
                        onChange={(e) => setFurnishing(e.target.value as FurnishingType)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="UNFURNISHED">Unfurnished</option>
                        <option value="SEMI_FURNISHED">Semi-Furnished</option>
                        <option value="FURNISHED">Furnished</option>
                      </select>
                    </div>
                  ) : null}
                </div>

                {formConfig.showResaleToggle ? (
                  <label className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input type="checkbox" checked={isResale} onChange={(e) => setIsResale(e.target.checked)} />
                    <span>Resale Property</span>
                  </label>
                ) : null}

                {/* Location & Address Privacy */}
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  <LocationPicker locations={INDIA_LOCATIONS_SEED} value={locationId} onChange={setLocationId} label="Property Location" />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <input
                      type="text"
                      required
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      placeholder="Locality / Neighbourhood"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit PIN Code"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <select
                      value={addressPrivacy}
                      onChange={(e) => setAddressPrivacy(e.target.value as AddressPrivacy)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="CITY_LOCALITY_ONLY">Show City &amp; Locality Only (Private Street)</option>
                      <option value="ON_APPROVED_VISIT">Reveal Street on Approved Visit Only</option>
                      <option value="PUBLIC">Show Full Address Publicly</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    required
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="Full Street / Survey / Door Address (masked per privacy control)"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={amenitiesText}
                    onChange={(e) => setAmenitiesText(e.target.value)}
                    placeholder="Amenities (comma separated)"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <button type="submit" className="mt-4 rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800">
                  Publish Property Listing
                </button>
              </form>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900">Manage Properties ({properties.length})</h3>
                <div className="mt-3 space-y-3">
                  {properties.map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-4">
                      <div>
                        <p className="font-bold text-slate-900">{p.title}</p>
                        <p className="text-xs text-slate-500">{p.city_name} ({p.pincode})</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={p.status} />
                        <button
                          type="button"
                          onClick={async () => {
                            await propertyStore.updatePropertyStatus(user, p.id, p.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE');
                            await loadData();
                          }}
                          className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium"
                        >
                          {p.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : tab === 'enquiries' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Buyer, Tenant &amp; Visit Requests ({enquiries.length})</h2>
              <div className="mt-4 space-y-3">
                {enquiries.map((enq) => (
                  <div key={enq.id} className="rounded-xl border border-slate-200 p-4 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">
                        {enq.enquiry_type.replace('_', ' ')} — {enq.sender_name}
                      </span>
                      <StatusBadge status={enq.status} />
                    </div>
                    <p className="mt-1 text-slate-500">Property: {enq.property_title}</p>
                    {enq.preferred_visit_date ? (
                      <p className="mt-0.5 font-medium text-brand-700">Preferred Visit: {enq.preferred_visit_date}</p>
                    ) : null}
                    <p className="mt-2 text-slate-700">{enq.message}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <input
                        type="text"
                        value={replyDrafts[enq.id] ?? ''}
                        onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [enq.id]: e.target.value }))}
                        placeholder="Reply or visit confirmation note..."
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                      />
                      {(['VISIT_CONFIRMED', 'CONTACTED', 'CLOSED'] as PropertyEnquiryStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={async () => {
                            await propertyStore.updatePropertyEnquiry(user, enq.id, st, replyDrafts[enq.id] || `Status updated to ${st}`);
                            setNotice(`Enquiry updated to ${st}.`);
                            await loadData();
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
          ) : tab === 'documents' ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <span>{NON_LEGAL_TITLE_DISCLAIMER}</span>
                </div>
              </div>

              <form onSubmit={handleUploadDoc} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Submit Supporting Property Document</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <select
                    value={docPropId}
                    onChange={(e) => setDocPropId(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as PropertyDocument['document_type'])}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="TAX_RECEIPT">Municipal Tax Receipt</option>
                    <option value="UTILITY_BILL">Electricity / Water Bill</option>
                    <option value="AUTHORISATION_LETTER">Agent Authorisation Letter</option>
                    <option value="FLOOR_PLAN">Floor Plan</option>
                    <option value="OTHER">Other Supporting Document</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={docFileName}
                    onChange={(e) => setDocFileName(e.target.value)}
                    placeholder="Document file name (e.g. Tax_2026.pdf)"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <button type="submit" className="mt-4 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
                  Submit Document for Review
                </button>
              </form>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900">Submitted Documents ({documents.length})</h3>
                <div className="mt-3 space-y-2 text-xs">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3">
                      <div>
                        <p className="font-bold text-slate-900">{doc.file_name} ({doc.document_type})</p>
                        <p className="text-slate-500">{doc.disclaimer_text}</p>
                      </div>
                      <StatusBadge status={doc.review_status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Property Listing &amp; Featured Subscriptions</h2>
              <p className="mt-1 text-xs text-slate-600">
                Active Property Listings: <strong>{properties.filter((p) => p.status === 'ACTIVE').length}</strong> · Razorpay checkout activates in Phase 5.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {DEFAULT_PRICING_TIERS.slice(0, 3).map((tier) => (
                  <div key={tier.code} className="rounded-xl border border-slate-200 p-4">
                    <p className="font-bold text-slate-900">{tier.name}</p>
                    <p className="text-xl font-extrabold text-brand-700">₹{tier.monthly_inr}/mo</p>
                    <p className="mt-1 text-xs text-slate-500">Up to {tier.active_listings_limit} active listings</p>
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
