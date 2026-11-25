import { INDIA_LOCATIONS_SEED } from '../data/indiaLocationsSeed';
import { getSupabaseClient } from '../lib/supabase';
import type { ModerationReport, UserWithRoles } from '../types/domain';
import type {
  AddressPrivacy,
  AreaUnit,
  FurnishingType,
  PropertyDocument,
  PropertyEnquiry,
  PropertyEnquiryStatus,
  PropertyEnquiryType,
  PropertyListing,
  PropertyPurpose,
  PropertySearchFilters,
  PropertyStatus,
  PropertyType,
} from '../types/property';
import { getDescendantLocationIds, isValidIndianPincode } from './locationSearch';
import { hasAnyAdminRole } from './permissions';

export const NON_LEGAL_TITLE_DISCLAIMER =
  'Document review confirms submission metadata only and does NOT verify legal property title, encumbrance status, or statutory RERA compliance. Buyers and tenants must conduct independent legal due diligence.';

const PROPERTY_SANDBOX_KEY = 'shalom_connecthub_property_v1';

interface PropertySandboxState {
  properties: PropertyListing[];
  documents: PropertyDocument[];
  enquiries: PropertyEnquiry[];
  reports: ModerationReport[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return `${prefix}-${rand}`;
}

function buildInitialPropertySandbox(): PropertySandboxState {
  const properties: PropertyListing[] = [
    {
      id: 'prop-1',
      listing_id: 'lst-property-preview-1',
      owner_id: 'usr-property-owner',
      owner_name: 'Thomas Mathew (Owner)',
      authorised_agent_id: 'usr-agent-demo',
      lister_role: 'OWNER',
      title: '3 BHK Waterfront Apartment for Rent — Marine Drive, Kochi',
      slug: '3bhk-waterfront-apartment-kochi',
      description:
        'Spacious semi-furnished 3 BHK family flat near Marine Drive with covered parking, 24x7 security, and backup power.',
      property_type: 'APARTMENT_FLAT',
      purpose: 'RENT',
      is_resale: false,
      is_featured: true,
      status: 'ACTIVE',
      listing_status: 'APPROVED',
      expires_at: '2027-03-31T23:59:59Z',
      location_id: 'loc-city-in-kl-kochi',
      state_name: 'Kerala',
      district_name: 'Ernakulam District',
      city_name: 'Kochi',
      pincode: '682001',
      locality: 'Marine Drive',
      full_address: 'Flat 7B, Backwater Enclave, Marine Drive, Kochi 682001',
      address_privacy: 'CITY_LOCALITY_ONLY',
      area_value: 1680,
      area_unit: 'SQ_FT',
      bedrooms: 3,
      bathrooms: 3,
      furnishing: 'SEMI_FURNISHED',
      pg_sharing_type: null,
      meals_included: null,
      gender_preference: null,
      sale_price: null,
      monthly_rent: 32000,
      security_deposit: 90000,
      lease_duration_months: null,
      is_negotiable: true,
      amenities: ['Parking', 'Security', 'Lift', 'Power Backup'],
      photo_urls: [],
      created_at: '2026-11-23T12:00:00Z',
    },
    {
      id: 'prop-2',
      listing_id: 'lst-prop-2',
      owner_id: 'usr-property-owner',
      owner_name: 'Thomas Mathew (Owner)',
      authorised_agent_id: null,
      lister_role: 'OWNER',
      title: 'Commercial Retail Shop on Main Market Road — Gorakhpur',
      slug: 'commercial-shop-gorakhpur-273001',
      description: 'Ground-floor corner retail space ideal for pharmacy, clinic, or electronics showroom.',
      property_type: 'COMMERCIAL_SHOP',
      purpose: 'SALE',
      is_resale: true,
      is_featured: false,
      status: 'ACTIVE',
      listing_status: 'APPROVED',
      expires_at: '2027-04-15T23:59:59Z',
      location_id: 'loc-city-in-up-gorakhpur',
      state_name: 'Uttar Pradesh',
      district_name: 'Gorakhpur District',
      city_name: 'Gorakhpur',
      pincode: '273001',
      locality: 'Golghar',
      full_address: 'Shop 14, Golghar Main Road, Gorakhpur 273001',
      address_privacy: 'ON_APPROVED_VISIT',
      area_value: 540,
      area_unit: 'SQ_FT',
      bedrooms: null,
      bathrooms: null,
      furnishing: 'UNFURNISHED',
      pg_sharing_type: null,
      meals_included: null,
      gender_preference: null,
      sale_price: 5800000,
      monthly_rent: null,
      security_deposit: null,
      lease_duration_months: null,
      is_negotiable: true,
      amenities: ['Main Road Facing', 'Water Connection', '3-Phase Power'],
      photo_urls: [],
      created_at: '2026-11-24T09:00:00Z',
    },
    {
      id: 'prop-3',
      listing_id: 'lst-prop-3',
      owner_id: 'usr-employer-demo',
      owner_name: 'Ananya Verma',
      authorised_agent_id: null,
      lister_role: 'OWNER',
      title: 'Managed Women’s Hostel / PG Near Koramangala — Bengaluru',
      slug: 'womens-pg-koramangala-bengaluru',
      description: 'Twin-sharing & single rooms with homely South/North Indian meals, Wi-Fi, and biometric entry.',
      property_type: 'HOSTEL_PG',
      purpose: 'RENT',
      is_resale: false,
      is_featured: false,
      status: 'ACTIVE',
      listing_status: 'APPROVED',
      expires_at: '2027-03-15T23:59:59Z',
      location_id: 'loc-city-in-ka-bengaluru',
      state_name: 'Karnataka',
      district_name: 'Bengaluru Urban',
      city_name: 'Bengaluru',
      pincode: '560001',
      locality: 'Koramangala',
      full_address: '42, 4th Block, Koramangala, Bengaluru 560001',
      address_privacy: 'CITY_LOCALITY_ONLY',
      area_value: 220,
      area_unit: 'SQ_FT',
      bedrooms: null,
      bathrooms: null,
      furnishing: 'FURNISHED',
      pg_sharing_type: '2-Sharing & Single',
      meals_included: true,
      gender_preference: 'FEMALE',
      sale_price: null,
      monthly_rent: 11500,
      security_deposit: 20000,
      lease_duration_months: null,
      is_negotiable: false,
      amenities: ['Wi-Fi', 'Meals Included', 'CCTV', 'Laundry'],
      photo_urls: [],
      created_at: '2026-11-24T11:30:00Z',
    },
    {
      id: 'prop-4',
      listing_id: 'lst-prop-4',
      owner_id: 'usr-property-owner',
      owner_name: 'Thomas Mathew (Owner)',
      authorised_agent_id: 'usr-agent-demo',
      lister_role: 'OWNER',
      title: '2.5 Acres Fertile Agricultural Land for Lease — Ernakulam',
      slug: 'agricultural-land-lease-ernakulam',
      description: 'Irrigated farmland with road access suitable for spice, banana, or organic horticulture.',
      property_type: 'AGRICULTURAL_LAND',
      purpose: 'LEASE',
      is_resale: false,
      is_featured: false,
      status: 'ACTIVE',
      listing_status: 'APPROVED',
      expires_at: '2027-05-01T23:59:59Z',
      location_id: 'loc-dist-in-kl-ernakulam-dist',
      state_name: 'Kerala',
      district_name: 'Ernakulam District',
      city_name: 'Aluva',
      pincode: '683101',
      locality: 'Aluva East',
      full_address: 'Survey 112/4, Aluva East, Ernakulam 683101',
      address_privacy: 'ON_APPROVED_VISIT',
      area_value: 2.5,
      area_unit: 'ACRE',
      bedrooms: null,
      bathrooms: null,
      furnishing: null,
      pg_sharing_type: null,
      meals_included: null,
      gender_preference: null,
      sale_price: null,
      monthly_rent: 18000,
      security_deposit: 50000,
      lease_duration_months: 36,
      is_negotiable: true,
      amenities: ['Borewell Irrigation', 'Tar Road Access'],
      photo_urls: [],
      created_at: '2026-11-24T14:00:00Z',
    },
  ];

  const documents: PropertyDocument[] = [
    {
      id: 'pdoc-1',
      property_id: 'prop-1',
      uploaded_by: 'usr-property-owner',
      document_type: 'TAX_RECEIPT',
      file_name: 'Kochi_Property_Tax_2026.pdf',
      storage_path: 'usr-property-owner/Kochi_Property_Tax_2026.pdf',
      review_status: 'REVIEWED',
      reviewer_notes: 'Tax receipt uploaded; no legal title guarantee claimed.',
      disclaimer_text: NON_LEGAL_TITLE_DISCLAIMER,
      created_at: '2026-11-23T12:15:00Z',
    },
  ];

  const enquiries: PropertyEnquiry[] = [
    {
      id: 'penq-1',
      property_id: 'prop-1',
      property_title: '3 BHK Waterfront Apartment for Rent — Marine Drive, Kochi',
      sender_id: 'usr-employer-demo',
      sender_name: 'Ananya Verma (Employer)',
      owner_id: 'usr-property-owner',
      authorised_agent_id: 'usr-agent-demo',
      enquiry_type: 'VISIT_REQUEST',
      preferred_visit_date: '2026-11-30',
      message: 'Would like to inspect the apartment with family this Sunday at 11 AM.',
      status: 'NEW',
      owner_reply: null,
      created_at: '2026-11-24T16:30:00Z',
    },
  ];

  return { properties, documents, enquiries, reports: [] };
}

let propMemoryFallback: PropertySandboxState | null = null;

function readPropSandbox(): PropertySandboxState {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(PROPERTY_SANDBOX_KEY);
      if (raw) return JSON.parse(raw) as PropertySandboxState;
    } catch {
      // Fallback
    }
  }
  if (!propMemoryFallback) {
    propMemoryFallback = buildInitialPropertySandbox();
  }
  return propMemoryFallback;
}

function writePropSandbox(state: PropertySandboxState): void {
  propMemoryFallback = state;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(PROPERTY_SANDBOX_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }
}

export function resetPropertySandboxForTests(): void {
  writePropSandbox(buildInitialPropertySandbox());
}

export function getDisplayAddress(property: PropertyListing, viewer: UserWithRoles | null): string {
  const isAuthorized =
    viewer !== null &&
    (property.owner_id === viewer.profile.id ||
      property.authorised_agent_id === viewer.profile.id ||
      hasAnyAdminRole(viewer.roles));

  if (isAuthorized || property.address_privacy === 'PUBLIC') {
    return property.full_address;
  }
  if (property.address_privacy === 'CITY_LOCALITY_ONLY') {
    return `${property.locality ? `${property.locality}, ` : ''}${property.city_name}, ${property.state_name} (${property.pincode}) — Exact street shared on visit confirmation`;
  }
  return `${property.city_name}, ${property.district_name}, ${property.state_name} (${property.pincode}) — Address disclosed upon approved visit request`;
}

function assertOwnerOrAssignedAgent(user: UserWithRoles, prop: PropertyListing): void {
  const allowed =
    prop.owner_id === user.profile.id ||
    prop.authorised_agent_id === user.profile.id ||
    hasAnyAdminRole(user.roles);
  if (!allowed) {
    throw new Error('Unauthorized: only the property owner or assigned authorised agent may access this property.');
  }
}

export const propertyStore = {
  async searchProperties(filters: PropertySearchFilters = {}): Promise<{ items: PropertyListing[]; total: number }> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.max(1, Math.min(50, filters.pageSize ?? 12));
    const supabase = getSupabaseClient();

    if (supabase) {
      let q = supabase
        .from('properties')
        .select('*, listings!inner(title, slug, description, is_featured, status), property_details!inner(*), property_pricing!inner(*), property_locations!inner(*)', { count: 'exact' });
      if (!filters.includeUnapproved) {
        q = q.eq('status', 'ACTIVE').eq('listings.status', 'APPROVED');
      }
      if (filters.propertyType && filters.propertyType !== 'ALL') {
        q = q.eq('property_type', filters.propertyType);
      }
      if (filters.purpose && filters.purpose !== 'ALL') {
        q = q.eq('purpose', filters.purpose);
      }
      const from = (page - 1) * pageSize;
      const { data, count, error } = await q.range(from, from + pageSize - 1);
      if (error) throw new Error(error.message);
      const mapped = (data ?? []).map((row: Record<string, unknown>) => {
        const l = row.listings as Record<string, unknown>;
        const d = row.property_details as Record<string, unknown>;
        const p = row.property_pricing as Record<string, unknown>;
        const loc = row.property_locations as Record<string, unknown>;
        return {
          ...(row as unknown as PropertyListing),
          title: String(l?.title ?? ''),
          slug: String(l?.slug ?? ''),
          description: String(l?.description ?? ''),
          is_featured: Boolean(l?.is_featured),
          listing_status: (l?.status as PropertyListing['listing_status']) ?? 'APPROVED',
          owner_name: 'Verified Lister',
          area_value: Number(d?.area_value ?? 0),
          area_unit: (d?.area_unit as AreaUnit) ?? 'SQ_FT',
          bedrooms: (d?.bedrooms as number | null) ?? null,
          bathrooms: (d?.bathrooms as number | null) ?? null,
          furnishing: (d?.furnishing as FurnishingType | null) ?? null,
          pg_sharing_type: (d?.pg_sharing_type as string | null) ?? null,
          meals_included: (d?.meals_included as boolean | null) ?? null,
          gender_preference: (d?.gender_preference as PropertyListing['gender_preference']) ?? null,
          sale_price: (p?.sale_price as number | null) ?? null,
          monthly_rent: (p?.monthly_rent as number | null) ?? null,
          security_deposit: (p?.security_deposit as number | null) ?? null,
          lease_duration_months: (p?.lease_duration_months as number | null) ?? null,
          is_negotiable: Boolean(p?.is_negotiable ?? true),
          location_id: (loc?.location_id as string | null) ?? null,
          state_name: String(loc?.state_name ?? ''),
          district_name: String(loc?.district_name ?? ''),
          city_name: String(loc?.city_name ?? ''),
          pincode: String(loc?.pincode ?? ''),
          locality: String(loc?.locality ?? ''),
          full_address: String(loc?.full_address ?? ''),
          address_privacy: (loc?.address_privacy as AddressPrivacy) ?? 'CITY_LOCALITY_ONLY',
          amenities: [],
          photo_urls: [],
        } as PropertyListing;
      });
      return { items: mapped, total: count ?? mapped.length };
    }

    const state = readPropSandbox();
    const now = Date.now();
    const q = filters.query?.trim().toLowerCase() ?? '';
    const amenityQ = filters.amenity?.trim().toLowerCase() ?? '';
    const allowedLocs = filters.locationId
      ? getDescendantLocationIds(filters.locationId, INDIA_LOCATIONS_SEED)
      : null;

    const filtered = state.properties.filter((prop) => {
      const notExpired = !prop.expires_at || new Date(prop.expires_at).getTime() > now;
      if (!filters.includeUnapproved && (prop.status !== 'ACTIVE' || prop.listing_status !== 'APPROVED' || !notExpired)) {
        return false;
      }
      if (filters.propertyType && filters.propertyType !== 'ALL' && prop.property_type !== filters.propertyType) {
        return false;
      }
      if (filters.purpose && filters.purpose !== 'ALL' && prop.purpose !== filters.purpose) {
        return false;
      }
      const effectivePrice = prop.purpose === 'SALE' ? (prop.sale_price ?? 0) : (prop.monthly_rent ?? 0);
      if (filters.minPrice !== undefined && effectivePrice < filters.minPrice) return false;
      if (filters.maxPrice !== undefined && effectivePrice > filters.maxPrice) return false;
      if (filters.minBedrooms !== undefined && (prop.bedrooms ?? 0) < filters.minBedrooms) return false;
      if (filters.minArea !== undefined && prop.area_value < filters.minArea) return false;
      if (amenityQ && !prop.amenities.some((a) => a.toLowerCase().includes(amenityQ))) return false;
      if (filters.pincode?.trim() && prop.pincode !== filters.pincode.trim()) return false;
      if (allowedLocs && (!prop.location_id || !allowedLocs.has(prop.location_id))) return false;
      if (q) {
        const hay = `${prop.title} ${prop.description} ${prop.city_name} ${prop.locality} ${prop.state_name} ${prop.pincode}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      return b.created_at.localeCompare(a.created_at);
    });
    const start = (page - 1) * pageSize;
    return { items: sorted.slice(start, start + pageSize), total: sorted.length };
  },

  async getPropertyBySlug(slug: string): Promise<PropertyListing | null> {
    const res = await this.searchProperties({ includeUnapproved: true, pageSize: 50 });
    return res.items.find((p) => p.slug === slug) ?? null;
  },

  async getManagedProperties(user: UserWithRoles): Promise<PropertyListing[]> {
    const state = readPropSandbox();
    return state.properties.filter(
      (p) =>
        p.owner_id === user.profile.id ||
        p.authorised_agent_id === user.profile.id ||
        hasAnyAdminRole(user.roles)
    );
  },

  async createPropertyListing(
    user: UserWithRoles,
    payload: {
      title: string;
      description: string;
      property_type: PropertyType;
      purpose: PropertyPurpose;
      is_resale: boolean;
      lister_role: 'OWNER' | 'AUTHORISED_AGENT';
      authorised_agent_id?: string | null;
      location_id: string | null;
      state_name: string;
      district_name: string;
      city_name: string;
      pincode: string;
      locality: string;
      full_address: string;
      address_privacy: AddressPrivacy;
      area_value: number;
      area_unit: AreaUnit;
      bedrooms: number | null;
      bathrooms: number | null;
      furnishing: FurnishingType | null;
      pg_sharing_type?: string | null;
      meals_included?: boolean | null;
      gender_preference?: 'ANY' | 'MALE' | 'FEMALE' | null;
      sale_price: number | null;
      monthly_rent: number | null;
      security_deposit: number | null;
      lease_duration_months: number | null;
      is_negotiable: boolean;
      amenities: string[];
    }
  ): Promise<PropertyListing> {
    if (
      !user.roles.includes('property_owner') &&
      !user.roles.includes('property_agent') &&
      !hasAnyAdminRole(user.roles)
    ) {
      throw new Error('Unauthorized: Property Owner or Property Agent role is required.');
    }
    if (!payload.title.trim()) throw new Error('Property title is required.');
    if (!isValidIndianPincode(payload.pincode)) throw new Error('Valid 6-digit Indian PIN code is required.');
    if (!payload.area_value || payload.area_value <= 0) throw new Error('Area must be greater than zero.');

    const slug = `${payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`;
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const state = readPropSandbox();
    const created: PropertyListing = {
      id: makeId('prop'),
      listing_id: makeId('lst'),
      owner_id: user.profile.id,
      owner_name: user.profile.full_name,
      authorised_agent_id: payload.authorised_agent_id ?? (payload.lister_role === 'AUTHORISED_AGENT' ? user.profile.id : null),
      lister_role: payload.lister_role,
      title: payload.title.trim(),
      slug,
      description: payload.description.trim(),
      property_type: payload.property_type,
      purpose: payload.purpose,
      is_resale: payload.is_resale,
      is_featured: false,
      status: 'ACTIVE',
      listing_status: 'APPROVED',
      expires_at: expiresAt,
      location_id: payload.location_id,
      state_name: payload.state_name,
      district_name: payload.district_name,
      city_name: payload.city_name,
      pincode: payload.pincode.trim(),
      locality: payload.locality.trim(),
      full_address: payload.full_address.trim(),
      address_privacy: payload.address_privacy,
      area_value: payload.area_value,
      area_unit: payload.area_unit,
      bedrooms: payload.bedrooms,
      bathrooms: payload.bathrooms,
      furnishing: payload.furnishing,
      pg_sharing_type: payload.pg_sharing_type ?? null,
      meals_included: payload.meals_included ?? null,
      gender_preference: payload.gender_preference ?? null,
      sale_price: payload.sale_price,
      monthly_rent: payload.monthly_rent,
      security_deposit: payload.security_deposit,
      lease_duration_months: payload.lease_duration_months,
      is_negotiable: payload.is_negotiable,
      amenities: payload.amenities,
      photo_urls: [],
      created_at: nowIso(),
    };
    state.properties.unshift(created);
    writePropSandbox(state);
    return created;
  },

  async updatePropertyStatus(user: UserWithRoles, propertyId: string, status: PropertyStatus): Promise<PropertyListing> {
    const state = readPropSandbox();
    const prop = state.properties.find((p) => p.id === propertyId);
    if (!prop) throw new Error('Property not found.');
    assertOwnerOrAssignedAgent(user, prop);
    prop.status = status;
    writePropSandbox(state);
    return prop;
  },

  async uploadPropertyDocument(
    user: UserWithRoles,
    propertyId: string,
    payload: { document_type: PropertyDocument['document_type']; file_name: string }
  ): Promise<PropertyDocument> {
    const state = readPropSandbox();
    const prop = state.properties.find((p) => p.id === propertyId);
    if (!prop) throw new Error('Property not found.');
    assertOwnerOrAssignedAgent(user, prop);

    const doc: PropertyDocument = {
      id: makeId('pdoc'),
      property_id: propertyId,
      uploaded_by: user.profile.id,
      document_type: payload.document_type,
      file_name: payload.file_name,
      storage_path: `${user.profile.id}/${propertyId}/${payload.file_name}`,
      review_status: 'PENDING',
      reviewer_notes: null,
      disclaimer_text: NON_LEGAL_TITLE_DISCLAIMER,
      created_at: nowIso(),
    };
    state.documents.unshift(doc);
    writePropSandbox(state);
    return doc;
  },

  async getPropertyDocuments(user: UserWithRoles, propertyId?: string): Promise<PropertyDocument[]> {
    const state = readPropSandbox();
    const allowedPropIds = new Set(
      state.properties
        .filter(
          (p) =>
            p.owner_id === user.profile.id ||
            p.authorised_agent_id === user.profile.id ||
            hasAnyAdminRole(user.roles)
        )
        .map((p) => p.id)
    );

    if (propertyId && !allowedPropIds.has(propertyId)) {
      throw new Error('Unauthorized: you are not authorised to view documents for this property.');
    }

    return state.documents.filter(
      (d) => allowedPropIds.has(d.property_id) && (!propertyId || d.property_id === propertyId)
    );
  },

  async submitPropertyEnquiry(
    user: UserWithRoles,
    payload: {
      propertyId: string;
      enquiryType: PropertyEnquiryType;
      preferredVisitDate?: string;
      message: string;
    }
  ): Promise<PropertyEnquiry> {
    if (!payload.message.trim()) throw new Error('Enquiry message is required.');
    const state = readPropSandbox();
    const prop = state.properties.find((p) => p.id === payload.propertyId);
    if (!prop || prop.status !== 'ACTIVE') {
      throw new Error('This property is not accepting enquiries.');
    }

    const row: PropertyEnquiry = {
      id: makeId('penq'),
      property_id: prop.id,
      property_title: prop.title,
      sender_id: user.profile.id,
      sender_name: user.profile.full_name,
      owner_id: prop.owner_id,
      authorised_agent_id: prop.authorised_agent_id,
      enquiry_type: payload.enquiryType,
      preferred_visit_date: payload.preferredVisitDate || null,
      message: payload.message.trim(),
      status: 'NEW',
      owner_reply: null,
      created_at: nowIso(),
    };
    state.enquiries.unshift(row);
    writePropSandbox(state);
    return row;
  },

  async getPropertyEnquiries(user: UserWithRoles): Promise<PropertyEnquiry[]> {
    const state = readPropSandbox();
    return state.enquiries.filter(
      (e) =>
        e.sender_id === user.profile.id ||
        e.owner_id === user.profile.id ||
        e.authorised_agent_id === user.profile.id ||
        hasAnyAdminRole(user.roles)
    );
  },

  async updatePropertyEnquiry(
    user: UserWithRoles,
    enquiryId: string,
    status: PropertyEnquiryStatus,
    reply?: string
  ): Promise<PropertyEnquiry> {
    const state = readPropSandbox();
    const enq = state.enquiries.find((e) => e.id === enquiryId);
    if (!enq) throw new Error('Enquiry not found.');
    const authorized =
      enq.owner_id === user.profile.id ||
      enq.authorised_agent_id === user.profile.id ||
      hasAnyAdminRole(user.roles);
    if (!authorized) {
      throw new Error('Unauthorized: only the property owner or assigned agent may update this enquiry.');
    }
    enq.status = status;
    if (reply !== undefined) enq.owner_reply = reply.trim();
    writePropSandbox(state);
    return enq;
  },

  async reportProperty(
    user: UserWithRoles,
    propertyId: string,
    reason: string,
    details: string
  ): Promise<ModerationReport> {
    if (!reason.trim()) throw new Error('Report reason is required.');
    const state = readPropSandbox();
    const report: ModerationReport = {
      id: makeId('rep'),
      reporter_id: user.profile.id,
      target_type: 'LISTING',
      target_id: propertyId,
      reason: reason.trim(),
      details: details.trim() || null,
      status: 'OPEN',
      resolution_notes: null,
      created_at: nowIso(),
    };
    state.reports.unshift(report);
    writePropSandbox(state);
    return report;
  },
};
