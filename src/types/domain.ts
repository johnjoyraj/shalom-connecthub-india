export type UserRole =
  | 'customer'
  | 'employer'
  | 'candidate'
  | 'property_owner'
  | 'property_agent'
  | 'school_admin'
  | 'service_provider'
  | 'org_member'
  | 'admin_moderation'
  | 'admin_finance'
  | 'admin_system'
  | 'super_admin';

export type AdminScope = 'overview' | 'moderation' | 'finance' | 'system' | 'users' | 'audit';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_DELETION' | 'DELETED';

export type PreferredLanguage = 'en' | 'hi' | 'ml';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  preferred_language: PreferredLanguage;
  primary_location_id: string | null;
  account_status: AccountStatus;
  profile_verified: boolean;
  suspension_reason: string | null;
  deletion_requested_at: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserWithRoles {
  profile: Profile;
  roles: UserRole[];
}

export type OrgType = 'COMPANY' | 'AGENCY' | 'SCHOOL' | 'INSTITUTION' | 'SERVICE_BUSINESS' | 'OTHER';
export type OrgStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
export type OrgMemberRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'AGENT';

export interface Organisation {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  org_type: OrgType;
  registration_number: string | null;
  gstin: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  location_id: string | null;
  address_line: string | null;
  status: OrgStatus;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganisationMember {
  id: string;
  organisation_id: string;
  user_id: string;
  member_role: OrgMemberRole;
  permissions: Record<string, boolean>;
  status: 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'REMOVED';
  created_at: string;
}

export type LocationLevel = 'COUNTRY' | 'STATE' | 'DISTRICT' | 'CITY' | 'PINCODE' | 'LOCALITY';

export interface LocationNode {
  id: string;
  country_code: string;
  level: LocationLevel;
  parent_id: string | null;
  name: string;
  slug: string;
  code: string | null;
  state_code: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
}

export type ModuleKey =
  | 'staff'
  | 'property'
  | 'school'
  | 'home_services'
  | 'business_directory'
  | 'vehicle_services'
  | 'transport'
  | 'construction'
  | 'event_management'
  | 'agriculture'
  | 'professional_services'
  | 'equipment_rentals'
  | 'local_services';

export interface Category {
  id: string;
  parent_id: string | null;
  module_key: ModuleKey;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sort_order: number;
  is_enabled: boolean;
  is_future_module: boolean;
}

export type ListingStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'EXPIRED';

export interface Listing {
  id: string;
  owner_id: string;
  organisation_id: string | null;
  module_key: ModuleKey;
  category_id: string | null;
  location_id: string | null;
  title: string;
  slug: string;
  summary: string;
  description: string;
  status: ListingStatus;
  is_featured: boolean;
  expires_at: string | null;
  moderation_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModerationReport {
  id: string;
  reporter_id: string;
  target_type: 'LISTING' | 'USER' | 'ORGANISATION' | 'REVIEW' | 'MESSAGE';
  target_id: string;
  reason: string;
  details: string | null;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';
  resolution_notes: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
}

export interface FeatureFlag {
  flag_key: string;
  label: string;
  description: string;
  is_enabled: boolean;
  config: Record<string, unknown>;
}

export interface PricingTier {
  code: string;
  name: string;
  monthly_inr: number;
  active_listings_limit: number;
  highlight: boolean;
  features: string[];
}

export type ConsentType = 'TERMS' | 'PRIVACY' | 'COOKIES' | 'WHATSAPP' | 'EMAIL' | 'PUSH' | 'MARKETING';

export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  granted: boolean;
  policy_version: string;
  source: string;
  created_at: string;
}
