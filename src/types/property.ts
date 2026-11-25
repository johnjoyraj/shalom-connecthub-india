export type PropertyType =
  | 'RENTAL_HOUSE'
  | 'APARTMENT_FLAT'
  | 'INDEPENDENT_HOUSE'
  | 'COMMERCIAL_SHOP'
  | 'OFFICE_SPACE'
  | 'HOSTEL_PG'
  | 'RESIDENTIAL_PLOT'
  | 'AGRICULTURAL_LAND';

export type PropertyPurpose = 'RENT' | 'SALE' | 'LEASE';
export type AreaUnit = 'SQ_FT' | 'SQ_YD' | 'SQ_M' | 'ACRE' | 'HECTARE' | 'CENT' | 'GUNTHA';
export type FurnishingType = 'UNFURNISHED' | 'SEMI_FURNISHED' | 'FURNISHED';
export type AddressPrivacy = 'PUBLIC' | 'CITY_LOCALITY_ONLY' | 'ON_APPROVED_VISIT';
export type PropertyStatus = 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'SOLD_OR_RENTED' | 'SUSPENDED';
export type PropertyEnquiryType = 'BUYER' | 'TENANT' | 'VISIT_REQUEST';
export type PropertyEnquiryStatus =
  | 'NEW'
  | 'VIEWED'
  | 'CONTACTED'
  | 'VISIT_CONFIRMED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CLOSED';

export interface PropertyListing {
  id: string;
  listing_id: string;
  owner_id: string;
  owner_name: string;
  authorised_agent_id: string | null;
  lister_role: 'OWNER' | 'AUTHORISED_AGENT';
  title: string;
  slug: string;
  description: string;
  property_type: PropertyType;
  purpose: PropertyPurpose;
  is_resale: boolean;
  is_featured: boolean;
  status: PropertyStatus;
  listing_status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'EXPIRED';
  expires_at: string;

  // Location & Privacy
  location_id: string | null;
  state_name: string;
  district_name: string;
  city_name: string;
  pincode: string;
  locality: string;
  full_address: string;
  address_privacy: AddressPrivacy;

  // Details
  area_value: number;
  area_unit: AreaUnit;
  bedrooms: number | null;
  bathrooms: number | null;
  furnishing: FurnishingType | null;
  pg_sharing_type: string | null;
  meals_included: boolean | null;
  gender_preference: 'ANY' | 'MALE' | 'FEMALE' | null;

  // Pricing
  sale_price: number | null;
  monthly_rent: number | null;
  security_deposit: number | null;
  lease_duration_months: number | null;
  is_negotiable: boolean;

  amenities: string[];
  photo_urls: string[];
  created_at: string;
}

export interface PropertyDocument {
  id: string;
  property_id: string;
  uploaded_by: string;
  document_type: 'TAX_RECEIPT' | 'UTILITY_BILL' | 'AUTHORISATION_LETTER' | 'FLOOR_PLAN' | 'OTHER';
  file_name: string;
  storage_path: string;
  review_status: 'PENDING' | 'UNDER_REVIEW' | 'REVIEWED' | 'REJECTED';
  reviewer_notes: string | null;
  disclaimer_text: string;
  created_at: string;
}

export interface PropertyEnquiry {
  id: string;
  property_id: string;
  property_title: string;
  sender_id: string;
  sender_name: string;
  owner_id: string;
  authorised_agent_id: string | null;
  enquiry_type: PropertyEnquiryType;
  preferred_visit_date: string | null;
  message: string;
  status: PropertyEnquiryStatus;
  owner_reply: string | null;
  created_at: string;
}

export interface PropertySearchFilters {
  query?: string;
  propertyType?: PropertyType | 'ALL';
  purpose?: PropertyPurpose | 'ALL';
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minArea?: number;
  amenity?: string;
  locationId?: string;
  pincode?: string;
  includeUnapproved?: boolean;
  page?: number;
  pageSize?: number;
}
