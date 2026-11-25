import { INDIA_LOCATIONS_SEED } from '../data/indiaLocationsSeed';
import {
  BRAND_INFO,
  DEFAULT_CATEGORIES,
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_PRICING_TIERS,
  SEED_LISTINGS,
  SEED_ORGANISATIONS,
} from '../data/platformDefaults';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import type {
  AccountStatus,
  AdminScope,
  AuditLogEntry,
  Category,
  ConsentRecord,
  ConsentType,
  FeatureFlag,
  Listing,
  ListingStatus,
  LocationNode,
  ModerationReport,
  ModuleKey,
  Organisation,
  OrganisationMember,
  OrgStatus,
  OrgType,
  PreferredLanguage,
  PricingTier,
  Profile,
  UserRole,
  UserWithRoles,
} from '../types/domain';
import { getDescendantLocationIds } from './locationSearch';
import { hasAdminScope, isAdminRole, isSelfAssignableRole } from './permissions';

const SANDBOX_STORAGE_KEY = 'shalom_connecthub_sandbox_v1';

interface SandboxState {
  currentUserId: string | null;
  users: UserWithRoles[];
  passwords: Record<string, string>;
  organisations: Organisation[];
  orgMembers: OrganisationMember[];
  locations: LocationNode[];
  categories: Category[];
  listings: Listing[];
  reports: ModerationReport[];
  auditLogs: AuditLogEntry[];
  featureFlags: FeatureFlag[];
  consents: ConsentRecord[];
  pricingTiers: PricingTier[];
  savedListingIdsByUser: Record<string, string[]>;
}

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
}

function buildInitialSandboxState(): SandboxState {
  const createdAt = '2026-11-20T08:00:00Z';
  const users: UserWithRoles[] = [
    {
      profile: {
        id: 'usr-super-admin',
        full_name: 'Platform Super Admin',
        email: 'admin@shalomconnecthub.in',
        phone: '+91 98000 00001',
        avatar_url: null,
        preferred_language: 'en',
        primary_location_id: 'loc-city-in-dl-new-delhi',
        account_status: 'ACTIVE',
        profile_verified: true,
        suspension_reason: null,
        deletion_requested_at: null,
        onboarding_completed: true,
        created_at: createdAt,
        updated_at: createdAt,
      },
      roles: ['super_admin', 'customer'],
    },
    {
      profile: {
        id: 'usr-employer-demo',
        full_name: 'Ananya Verma (Employer)',
        email: 'employer@example.in',
        phone: '+91 98000 00101',
        avatar_url: null,
        preferred_language: 'en',
        primary_location_id: 'loc-city-in-ka-bengaluru',
        account_status: 'ACTIVE',
        profile_verified: true,
        suspension_reason: null,
        deletion_requested_at: null,
        onboarding_completed: true,
        created_at: createdAt,
        updated_at: createdAt,
      },
      roles: ['customer', 'employer'],
    },
    {
      profile: {
        id: 'usr-school-admin',
        full_name: 'Principal Grace Model',
        email: 'school@example.in',
        phone: '+91 98000 00102',
        avatar_url: null,
        preferred_language: 'hi',
        primary_location_id: 'loc-city-in-up-gorakhpur',
        account_status: 'ACTIVE',
        profile_verified: true,
        suspension_reason: null,
        deletion_requested_at: null,
        onboarding_completed: true,
        created_at: createdAt,
        updated_at: createdAt,
      },
      roles: ['customer', 'school_admin', 'org_member'],
    },
    {
      profile: {
        id: 'usr-property-owner',
        full_name: 'Thomas Mathew (Owner)',
        email: 'owner@example.in',
        phone: '+91 98000 00103',
        avatar_url: null,
        preferred_language: 'ml',
        primary_location_id: 'loc-city-in-kl-kochi',
        account_status: 'ACTIVE',
        profile_verified: false,
        suspension_reason: null,
        deletion_requested_at: null,
        onboarding_completed: true,
        created_at: createdAt,
        updated_at: createdAt,
      },
      roles: ['customer', 'property_owner', 'org_member'],
    },
  ];

  const orgMembers: OrganisationMember[] = [
    {
      id: 'om-1',
      organisation_id: 'org-demo-school',
      user_id: 'usr-school-admin',
      member_role: 'OWNER',
      permissions: { manage_listings: true, manage_members: true },
      status: 'ACTIVE',
      created_at: createdAt,
    },
    {
      id: 'om-2',
      organisation_id: 'org-demo-realty',
      user_id: 'usr-property-owner',
      member_role: 'OWNER',
      permissions: { manage_listings: true, manage_members: true },
      status: 'ACTIVE',
      created_at: createdAt,
    },
  ];

  const auditLogs: AuditLogEntry[] = [
    {
      id: 'aud-init-1',
      actor_id: 'usr-super-admin',
      actor_role: 'super_admin',
      action: 'PLATFORM_INITIALIZED',
      entity_type: 'platform',
      entity_id: 'phase-1',
      before_state: null,
      after_state: { status: 'ACTIVE', states_seeded: 36 },
      reason: 'Phase 1 Core Architecture Initialization',
      created_at: '2026-11-25T05:30:00Z',
    },
  ];

  const reports: ModerationReport[] = [
    {
      id: 'rep-1',
      reporter_id: 'usr-employer-demo',
      target_type: 'LISTING',
      target_id: 'lst-school-preview-1',
      reason: 'Needs verification check before public display',
      details: 'Sample moderation queue ticket for Phase 1 admin testing.',
      status: 'OPEN',
      resolution_notes: null,
      created_at: '2026-11-24T14:00:00Z',
    },
  ];

  return {
    currentUserId: null,
    users,
    passwords: {
      'admin@shalomconnecthub.in': 'Admin@12345',
      'employer@example.in': 'Demo@12345',
      'school@example.in': 'Demo@12345',
      'owner@example.in': 'Demo@12345',
    },
    organisations: [...SEED_ORGANISATIONS],
    orgMembers,
    locations: [...INDIA_LOCATIONS_SEED],
    categories: [...DEFAULT_CATEGORIES],
    listings: [...SEED_LISTINGS],
    reports,
    auditLogs,
    featureFlags: [...DEFAULT_FEATURE_FLAGS],
    consents: [],
    pricingTiers: [...DEFAULT_PRICING_TIERS],
    savedListingIdsByUser: {},
  };
}

let memoryFallback: SandboxState | null = null;

function readSandbox(): SandboxState {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(SANDBOX_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as SandboxState;
      }
    } catch {
      // Fallback to memory if storage is unavailable
    }
  }
  if (!memoryFallback) {
    memoryFallback = buildInitialSandboxState();
  }
  return memoryFallback;
}

function writeSandbox(state: SandboxState): void {
  memoryFallback = state;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors in constrained environments
    }
  }
}

export function resetSandboxForTests(): void {
  const fresh = buildInitialSandboxState();
  writeSandbox(fresh);
}

function assertAdmin(roles: readonly UserRole[], scope: AdminScope): void {
  if (!hasAdminScope(roles, scope)) {
    throw new Error(`Unauthorized: requires admin permission scope "${scope}".`);
  }
}

function appendSandboxAudit(
  state: SandboxState,
  actor: UserWithRoles | null,
  action: string,
  entityType: string,
  entityId: string | null,
  beforeState: Record<string, unknown> | null,
  afterState: Record<string, unknown> | null,
  reason: string | null = null
): void {
  const actorRole = actor?.roles.find((r) => isAdminRole(r)) ?? actor?.roles[0] ?? null;
  state.auditLogs.unshift({
    id: createId('aud'),
    actor_id: actor?.profile.id ?? null,
    actor_role: actorRole,
    action,
    entity_type: entityType,
    entity_id: entityId,
    before_state: beforeState,
    after_state: afterState,
    reason,
    created_at: nowIso(),
  });
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  roles: UserRole[];
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  whatsappConsent?: boolean;
  emailConsent?: boolean;
}

export interface SearchListingsInput {
  query?: string;
  moduleKey?: ModuleKey | 'ALL';
  locationId?: string;
  pincode?: string;
  includeUnapproved?: boolean;
}

export const platformStore = {
  isLiveSupabase(): boolean {
    return isSupabaseConfigured();
  },

  async getCurrentSessionUser(): Promise<UserWithRoles | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return null;

      const [{ data: profile }, { data: roleRows }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', authData.user.id).single(),
        supabase.from('user_roles').select('role').eq('user_id', authData.user.id).eq('is_active', true),
      ]);

      if (!profile) return null;
      return {
        profile: profile as Profile,
        roles: (roleRows ?? []).map((r: { role: string }) => r.role as UserRole),
      };
    }

    const state = readSandbox();
    if (!state.currentUserId) return null;
    return state.users.find((u) => u.profile.id === state.currentUserId) ?? null;
  },

  async loginWithPassword(email: string, password: string): Promise<UserWithRoles> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      throw new Error('Email and password are required.');
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (error) throw new Error(error.message);
      const user = await this.getCurrentSessionUser();
      if (!user) throw new Error('Profile could not be loaded.');
      if (user.profile.account_status === 'SUSPENDED') {
        await supabase.auth.signOut();
        throw new Error('This account has been suspended. Contact support@shalomconnecthub.in.');
      }
      return user;
    }

    const state = readSandbox();
    const user = state.users.find((u) => u.profile.email.toLowerCase() === normalizedEmail);
    if (!user || state.passwords[normalizedEmail] !== password) {
      throw new Error('Invalid email or password.');
    }
    if (user.profile.account_status === 'SUSPENDED') {
      throw new Error('This account has been suspended by platform administration.');
    }
    state.currentUserId = user.profile.id;
    writeSandbox(state);
    return user;
  },

  async quickDemoLogin(userId: string): Promise<UserWithRoles> {
    if (isSupabaseConfigured()) {
      throw new Error('Demo switcher is disabled when live Supabase is active.');
    }
    const state = readSandbox();
    const user = state.users.find((u) => u.profile.id === userId);
    if (!user) throw new Error('Demo account not found.');
    if (user.profile.account_status === 'SUSPENDED') {
      throw new Error('Selected demo account is currently suspended.');
    }
    state.currentUserId = user.profile.id;
    writeSandbox(state);
    return user;
  },

  async registerUser(payload: RegisterPayload): Promise<UserWithRoles> {
    const email = payload.email.trim().toLowerCase();
    const fullName = payload.fullName.trim();
    if (!fullName) throw new Error('Full name is required.');
    if (!email || !email.includes('@')) throw new Error('Valid email address is required.');
    if (payload.password.length < 8) throw new Error('Password must be at least 8 characters.');
    if (!payload.acceptedTerms || !payload.acceptedPrivacy) {
      throw new Error('You must accept Terms of Service and Privacy Policy (DPDPA consent).');
    }

    // Security check: strip any privileged admin roles from self-registration
    const requestedSafeRoles = Array.from(
      new Set<UserRole>(['customer', ...payload.roles.filter((r) => isSelfAssignableRole(r))])
    );

    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: payload.password,
        options: {
          data: { full_name: fullName, phone: payload.phone?.trim() ?? null },
        },
      });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('Registration did not return a user record.');

      const extraRoles = requestedSafeRoles.filter((r) => r !== 'customer');
      if (extraRoles.length > 0 && data.session) {
        await supabase.from('user_roles').upsert(
          extraRoles.map((role) => ({ user_id: data.user!.id, role, is_active: true })),
          { onConflict: 'user_id,role' }
        );
      }

      if (data.session) {
        const consentsToInsert: Array<{ user_id: string; consent_type: ConsentType; granted: boolean; policy_version: string }> = [
          { user_id: data.user.id, consent_type: 'TERMS', granted: true, policy_version: BRAND_INFO.policyVersion },
          { user_id: data.user.id, consent_type: 'PRIVACY', granted: true, policy_version: BRAND_INFO.policyVersion },
          { user_id: data.user.id, consent_type: 'WHATSAPP', granted: Boolean(payload.whatsappConsent), policy_version: BRAND_INFO.policyVersion },
          { user_id: data.user.id, consent_type: 'EMAIL', granted: Boolean(payload.emailConsent), policy_version: BRAND_INFO.policyVersion },
        ];
        await supabase.from('consent_records').insert(consentsToInsert);
      }

      const loaded = await this.getCurrentSessionUser();
      if (loaded) return loaded;

      // Email confirmation enabled in Supabase Auth
      return {
        profile: {
          id: data.user.id,
          full_name: fullName,
          email,
          phone: payload.phone?.trim() ?? null,
          avatar_url: null,
          preferred_language: 'en',
          primary_location_id: null,
          account_status: 'ACTIVE',
          profile_verified: false,
          suspension_reason: null,
          deletion_requested_at: null,
          onboarding_completed: false,
          created_at: nowIso(),
          updated_at: nowIso(),
        },
        roles: requestedSafeRoles,
      };
    }

    const state = readSandbox();
    if (state.users.some((u) => u.profile.email.toLowerCase() === email)) {
      throw new Error('An account with this email already exists.');
    }

    const ts = nowIso();
    const newUser: UserWithRoles = {
      profile: {
        id: createId('usr'),
        full_name: fullName,
        email,
        phone: payload.phone?.trim() || null,
        avatar_url: null,
        preferred_language: 'en',
        primary_location_id: null,
        account_status: 'ACTIVE',
        profile_verified: false,
        suspension_reason: null,
        deletion_requested_at: null,
        onboarding_completed: false,
        created_at: ts,
        updated_at: ts,
      },
      roles: requestedSafeRoles,
    };

    state.users.push(newUser);
    state.passwords[email] = payload.password;
    state.currentUserId = newUser.profile.id;
    state.consents.push(
      { id: createId('con'), user_id: newUser.profile.id, consent_type: 'TERMS', granted: true, policy_version: BRAND_INFO.policyVersion, source: 'WEB', created_at: ts },
      { id: createId('con'), user_id: newUser.profile.id, consent_type: 'PRIVACY', granted: true, policy_version: BRAND_INFO.policyVersion, source: 'WEB', created_at: ts },
      { id: createId('con'), user_id: newUser.profile.id, consent_type: 'WHATSAPP', granted: Boolean(payload.whatsappConsent), policy_version: BRAND_INFO.policyVersion, source: 'WEB', created_at: ts },
      { id: createId('con'), user_id: newUser.profile.id, consent_type: 'EMAIL', granted: Boolean(payload.emailConsent), policy_version: BRAND_INFO.policyVersion, source: 'WEB', created_at: ts }
    );
    appendSandboxAudit(state, newUser, 'USER_REGISTERED', 'profile', newUser.profile.id, null, { roles: requestedSafeRoles });
    writeSandbox(state);
    return newUser;
  },

  async logout(): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
      return;
    }
    const state = readSandbox();
    state.currentUserId = null;
    writeSandbox(state);
  },

  async sendOtp(emailOrPhone: string): Promise<{ message: string }> {
    const target = emailOrPhone.trim();
    if (!target) throw new Error('Enter your registered email or phone number.');
    const supabase = getSupabaseClient();
    if (supabase) {
      const isEmail = target.includes('@');
      const { error } = isEmail
        ? await supabase.auth.signInWithOtp({ email: target })
        : await supabase.auth.signInWithOtp({ phone: target });
      if (error) throw new Error(error.message);
      return { message: `Verification OTP dispatched to ${target}.` };
    }
    return { message: `Sandbox OTP ready for ${target}. Use demo code 123456 to verify.` };
  },

  async verifyOtp(emailOrPhone: string, token: string): Promise<UserWithRoles> {
    const target = emailOrPhone.trim();
    const code = token.trim();
    if (!target || !code) throw new Error('Target and OTP code are required.');

    const supabase = getSupabaseClient();
    if (supabase) {
      const isEmail = target.includes('@');
      const { error } = isEmail
        ? await supabase.auth.verifyOtp({ email: target, token: code, type: 'email' })
        : await supabase.auth.verifyOtp({ phone: target, token: code, type: 'sms' });
      if (error) throw new Error(error.message);
      const user = await this.getCurrentSessionUser();
      if (!user) throw new Error('Unable to load verified user profile.');
      return user;
    }

    if (code !== '123456') {
      throw new Error('Invalid sandbox OTP code. Enter 123456.');
    }
    const state = readSandbox();
    const matched = state.users.find(
      (u) => u.profile.email.toLowerCase() === target.toLowerCase() || u.profile.phone === target
    );
    if (!matched) throw new Error('No account matches that email or phone.');
    state.currentUserId = matched.profile.id;
    writeSandbox(state);
    return matched;
  },

  async requestPasswordReset(email: string): Promise<string> {
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes('@')) throw new Error('Enter a valid email address.');
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(clean, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw new Error(error.message);
      return 'Password reset link sent to your registered email.';
    }
    return `If ${clean} is registered, a password recovery link has been queued (sandbox mode).`;
  },

  async updateMyProfile(
    userId: string,
    updates: {
      full_name?: string;
      phone?: string | null;
      preferred_language?: PreferredLanguage;
      primary_location_id?: string | null;
      onboarding_completed?: boolean;
      selfRoles?: UserRole[];
    }
  ): Promise<UserWithRoles> {
    const safeRoles = updates.selfRoles
      ? Array.from(new Set<UserRole>(['customer', ...updates.selfRoles.filter(isSelfAssignableRole)]))
      : null;

    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.full_name,
          phone: updates.phone,
          preferred_language: updates.preferred_language,
          primary_location_id: updates.primary_location_id,
          onboarding_completed: updates.onboarding_completed,
        })
        .eq('id', userId);
      if (error) throw new Error(error.message);

      if (safeRoles) {
        const { data: existing } = await supabase.from('user_roles').select('role').eq('user_id', userId);
        const existingAdminRoles = (existing ?? [])
          .map((r: { role: string }) => r.role as UserRole)
          .filter(isAdminRole);
        const targetRoles = Array.from(new Set([...safeRoles, ...existingAdminRoles]));
        await supabase.from('user_roles').upsert(
          targetRoles.map((role) => ({ user_id: userId, role, is_active: true })),
          { onConflict: 'user_id,role' }
        );
      }

      const refreshed = await this.getCurrentSessionUser();
      if (!refreshed) throw new Error('Failed to refresh profile.');
      return refreshed;
    }

    const state = readSandbox();
    const target = state.users.find((u) => u.profile.id === userId);
    if (!target) throw new Error('User profile not found.');

    target.profile = {
      ...target.profile,
      full_name: updates.full_name ?? target.profile.full_name,
      phone: updates.phone !== undefined ? updates.phone : target.profile.phone,
      preferred_language: updates.preferred_language ?? target.profile.preferred_language,
      primary_location_id:
        updates.primary_location_id !== undefined ? updates.primary_location_id : target.profile.primary_location_id,
      onboarding_completed: updates.onboarding_completed ?? target.profile.onboarding_completed,
      updated_at: nowIso(),
    };

    if (safeRoles) {
      const preservedAdminRoles = target.roles.filter(isAdminRole);
      target.roles = Array.from(new Set([...safeRoles, ...preservedAdminRoles]));
    }

    writeSandbox(state);
    return target;
  },

  async requestAccountDeletion(userId: string): Promise<Profile> {
    const supabase = getSupabaseClient();
    const ts = nowIso();
    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ account_status: 'PENDING_DELETION', deletion_requested_at: ts })
        .eq('id', userId)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await supabase.rpc('record_audit_log', {
        p_action: 'ACCOUNT_DELETION_REQUESTED',
        p_entity_type: 'profile',
        p_entity_id: userId,
      });
      return data as Profile;
    }

    const state = readSandbox();
    const user = state.users.find((u) => u.profile.id === userId);
    if (!user) throw new Error('User not found.');
    user.profile.account_status = 'PENDING_DELETION';
    user.profile.deletion_requested_at = ts;
    user.profile.updated_at = ts;
    appendSandboxAudit(state, user, 'ACCOUNT_DELETION_REQUESTED', 'profile', userId, null, { status: 'PENDING_DELETION' });
    writeSandbox(state);
    return user.profile;
  },

  async getLocations(includeInactive = false): Promise<LocationNode[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('locations').select('*').order('level').order('name');
      if (!includeInactive) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []) as LocationNode[];
    }
    const state = readSandbox();
    return state.locations.filter((l) => includeInactive || l.is_active);
  },

  async getCategories(includeDisabled = false): Promise<Category[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('categories').select('*').order('sort_order');
      if (!includeDisabled) query = query.eq('is_enabled', true);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []) as Category[];
    }
    const state = readSandbox();
    return [...state.categories]
      .filter((c) => includeDisabled || c.is_enabled)
      .sort((a, b) => a.sort_order - b.sort_order);
  },

  async getFeatureFlags(): Promise<FeatureFlag[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.from('feature_flags').select('*').order('flag_key');
      if (error) throw new Error(error.message);
      return (data ?? []) as FeatureFlag[];
    }
    return [...readSandbox().featureFlags];
  },

  async getPricingTiers(): Promise<PricingTier[]> {
    return [...readSandbox().pricingTiers];
  },

  async searchListings(input: SearchListingsInput): Promise<Listing[]> {
    const locations = await this.getLocations(false);
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('listings').select('*').order('is_featured', { ascending: false }).order('created_at', { ascending: false }).limit(50);
      if (!input.includeUnapproved) {
        query = query.eq('status', 'APPROVED');
      }
      if (input.moduleKey && input.moduleKey !== 'ALL') {
        query = query.eq('module_key', input.moduleKey);
      }
      if (input.query?.trim()) {
        query = query.ilike('title', `%${input.query.trim()}%`);
      }
      if (input.locationId) {
        const ids = Array.from(getDescendantLocationIds(input.locationId, locations));
        query = query.in('location_id', ids);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []) as Listing[];
    }

    const state = readSandbox();
    const allowedLocationIds = input.locationId
      ? getDescendantLocationIds(input.locationId, state.locations)
      : null;
    const pinLocationIds = input.pincode?.trim()
      ? new Set(state.locations.filter((l) => l.pincode === input.pincode?.trim()).map((l) => l.id))
      : null;
    const q = input.query?.trim().toLowerCase() ?? '';

    return state.listings.filter((item) => {
      if (!input.includeUnapproved && item.status !== 'APPROVED') return false;
      if (input.moduleKey && input.moduleKey !== 'ALL' && item.module_key !== input.moduleKey) return false;
      if (allowedLocationIds && (!item.location_id || !allowedLocationIds.has(item.location_id))) return false;
      if (pinLocationIds && (!item.location_id || !pinLocationIds.has(item.location_id))) return false;
      if (q) {
        const hay = `${item.title} ${item.summary} ${item.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  },

  async getMyOrganisations(userId: string): Promise<Organisation[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.from('organisations').select('*').eq('owner_id', userId);
      if (error) throw new Error(error.message);
      return (data ?? []) as Organisation[];
    }
    const state = readSandbox();
    const memberOrgIds = new Set(
      state.orgMembers.filter((m) => m.user_id === userId && m.status === 'ACTIVE').map((m) => m.organisation_id)
    );
    return state.organisations.filter((o) => o.owner_id === userId || memberOrgIds.has(o.id));
  },

  async createOrganisation(
    userId: string,
    payload: { name: string; org_type: OrgType; location_id: string | null; registration_number?: string; gstin?: string }
  ): Promise<Organisation> {
    const name = payload.name.trim();
    if (!name) throw new Error('Organisation name is required.');
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`;

    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('organisations')
        .insert({
          owner_id: userId,
          name,
          slug,
          org_type: payload.org_type,
          location_id: payload.location_id,
          registration_number: payload.registration_number || null,
          gstin: payload.gstin || null,
          status: 'PENDING',
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await supabase.from('organisation_members').insert({
        organisation_id: (data as Organisation).id,
        user_id: userId,
        member_role: 'OWNER',
        status: 'ACTIVE',
      });
      return data as Organisation;
    }

    const state = readSandbox();
    const ts = nowIso();
    const org: Organisation = {
      id: createId('org'),
      owner_id: userId,
      name,
      slug,
      org_type: payload.org_type,
      registration_number: payload.registration_number || null,
      gstin: payload.gstin || null,
      email: null,
      phone: null,
      website: null,
      location_id: payload.location_id,
      address_line: null,
      status: 'PENDING',
      verified: false,
      created_at: ts,
      updated_at: ts,
    };
    state.organisations.unshift(org);
    state.orgMembers.push({
      id: createId('om'),
      organisation_id: org.id,
      user_id: userId,
      member_role: 'OWNER',
      permissions: { manage_listings: true, manage_members: true },
      status: 'ACTIVE',
      created_at: ts,
    });
    const actor = state.users.find((u) => u.profile.id === userId) ?? null;
    appendSandboxAudit(state, actor, 'ORGANISATION_CREATED', 'organisation', org.id, null, { name: org.name, org_type: org.org_type });
    writeSandbox(state);
    return org;
  },

  async getMyConsents(userId: string): Promise<ConsentRecord[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('consent_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as ConsentRecord[];
    }
    return readSandbox().consents.filter((c) => c.user_id === userId);
  },

  async recordConsent(userId: string, consentType: ConsentType, granted: boolean): Promise<ConsentRecord> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('consent_records')
        .insert({ user_id: userId, consent_type: consentType, granted, policy_version: BRAND_INFO.policyVersion })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as ConsentRecord;
    }

    const state = readSandbox();
    const record: ConsentRecord = {
      id: createId('con'),
      user_id: userId,
      consent_type: consentType,
      granted,
      policy_version: BRAND_INFO.policyVersion,
      source: 'WEB',
      created_at: nowIso(),
    };
    state.consents.unshift(record);
    writeSandbox(state);
    return record;
  },

  // --------------------------------------------------------------------------
  // Administrator Control Centre APIs (Permission-guarded & Audit-logged)
  // --------------------------------------------------------------------------
  async adminListUsers(actorRoles: readonly UserRole[]): Promise<UserWithRoles[]> {
    assertAdmin(actorRoles, 'users');
    const supabase = getSupabaseClient();
    if (supabase) {
      const [{ data: profiles, error: pErr }, { data: rolesData, error: rErr }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id, role').eq('is_active', true),
      ]);
      if (pErr) throw new Error(pErr.message);
      if (rErr) throw new Error(rErr.message);
      const roleMap = new Map<string, UserRole[]>();
      for (const row of rolesData ?? []) {
        const list = roleMap.get(row.user_id) ?? [];
        list.push(row.role as UserRole);
        roleMap.set(row.user_id, list);
      }
      return ((profiles ?? []) as Profile[]).map((profile) => ({
        profile,
        roles: roleMap.get(profile.id) ?? ['customer'],
      }));
    }
    return [...readSandbox().users];
  },

  async adminUpdateUserStatus(
    actor: UserWithRoles,
    targetUserId: string,
    status: AccountStatus,
    verified: boolean,
    reason: string
  ): Promise<Profile> {
    assertAdmin(actor.roles, 'users');
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          account_status: status,
          profile_verified: verified,
          suspension_reason: status === 'SUSPENDED' ? reason : null,
        })
        .eq('id', targetUserId)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await supabase.rpc('record_audit_log', {
        p_action: 'ADMIN_USER_STATUS_UPDATED',
        p_entity_type: 'profile',
        p_entity_id: targetUserId,
        p_after_state: { account_status: status, profile_verified: verified },
        p_reason: reason,
      });
      return data as Profile;
    }

    const state = readSandbox();
    const target = state.users.find((u) => u.profile.id === targetUserId);
    if (!target) throw new Error('Target user not found.');
    const before = { account_status: target.profile.account_status, profile_verified: target.profile.profile_verified };
    target.profile.account_status = status;
    target.profile.profile_verified = verified;
    target.profile.suspension_reason = status === 'SUSPENDED' ? reason : null;
    target.profile.updated_at = nowIso();
    appendSandboxAudit(
      state,
      actor,
      'ADMIN_USER_STATUS_UPDATED',
      'profile',
      targetUserId,
      before,
      { account_status: status, profile_verified: verified },
      reason
    );
    writeSandbox(state);
    return target.profile;
  },

  async adminAssignUserRoles(actor: UserWithRoles, targetUserId: string, roles: UserRole[], reason: string): Promise<UserRole[]> {
    if (!actor.roles.includes('super_admin')) {
      throw new Error('Only Super Administrator may modify administrative or user role assignments.');
    }
    const cleanRoles = Array.from(new Set<UserRole>(roles.length ? roles : ['customer']));
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('user_roles').delete().eq('user_id', targetUserId);
      const { error } = await supabase.from('user_roles').insert(
        cleanRoles.map((role) => ({ user_id: targetUserId, role, is_active: true, granted_by: actor.profile.id }))
      );
      if (error) throw new Error(error.message);
      await supabase.rpc('record_audit_log', {
        p_action: 'ADMIN_USER_ROLES_ASSIGNED',
        p_entity_type: 'user_roles',
        p_entity_id: targetUserId,
        p_after_state: { roles: cleanRoles },
        p_reason: reason,
      });
      return cleanRoles;
    }

    const state = readSandbox();
    const target = state.users.find((u) => u.profile.id === targetUserId);
    if (!target) throw new Error('User not found.');
    const before = { roles: target.roles };
    target.roles = cleanRoles;
    appendSandboxAudit(state, actor, 'ADMIN_USER_ROLES_ASSIGNED', 'user_roles', targetUserId, before, { roles: cleanRoles }, reason);
    writeSandbox(state);
    return cleanRoles;
  },

  async adminListOrganisations(actorRoles: readonly UserRole[]): Promise<Organisation[]> {
    assertAdmin(actorRoles, 'moderation');
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.from('organisations').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Organisation[];
    }
    return [...readSandbox().organisations];
  },

  async adminUpdateOrganisationStatus(
    actor: UserWithRoles,
    orgId: string,
    status: OrgStatus,
    verified: boolean,
    reason: string
  ): Promise<Organisation> {
    assertAdmin(actor.roles, 'moderation');
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('organisations')
        .update({ status, verified })
        .eq('id', orgId)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await supabase.rpc('record_audit_log', {
        p_action: 'ADMIN_ORG_STATUS_UPDATED',
        p_entity_type: 'organisation',
        p_entity_id: orgId,
        p_after_state: { status, verified },
        p_reason: reason,
      });
      return data as Organisation;
    }

    const state = readSandbox();
    const org = state.organisations.find((o) => o.id === orgId);
    if (!org) throw new Error('Organisation not found.');
    const before = { status: org.status, verified: org.verified };
    org.status = status;
    org.verified = verified;
    org.updated_at = nowIso();
    appendSandboxAudit(state, actor, 'ADMIN_ORG_STATUS_UPDATED', 'organisation', orgId, before, { status, verified }, reason);
    writeSandbox(state);
    return org;
  },

  async adminUpdateListingStatus(
    actor: UserWithRoles,
    listingId: string,
    status: ListingStatus,
    isFeatured: boolean,
    reason: string
  ): Promise<Listing> {
    assertAdmin(actor.roles, 'moderation');
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('listings')
        .update({
          status,
          is_featured: isFeatured,
          moderation_notes: reason,
          approved_by: status === 'APPROVED' ? actor.profile.id : null,
          approved_at: status === 'APPROVED' ? nowIso() : null,
        })
        .eq('id', listingId)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await supabase.rpc('record_audit_log', {
        p_action: 'ADMIN_LISTING_STATUS_UPDATED',
        p_entity_type: 'listing',
        p_entity_id: listingId,
        p_after_state: { status, is_featured: isFeatured },
        p_reason: reason,
      });
      return data as Listing;
    }

    const state = readSandbox();
    const item = state.listings.find((l) => l.id === listingId);
    if (!item) throw new Error('Listing not found.');
    const before = { status: item.status, is_featured: item.is_featured };
    item.status = status;
    item.is_featured = isFeatured;
    item.moderation_notes = reason;
    item.updated_at = nowIso();
    appendSandboxAudit(state, actor, 'ADMIN_LISTING_STATUS_UPDATED', 'listing', listingId, before, { status, is_featured: isFeatured }, reason);
    writeSandbox(state);
    return item;
  },

  async adminToggleCategory(actor: UserWithRoles, categoryId: string, isEnabled: boolean): Promise<Category> {
    assertAdmin(actor.roles, 'system');
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('categories')
        .update({ is_enabled: isEnabled })
        .eq('id', categoryId)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await supabase.rpc('record_audit_log', {
        p_action: 'ADMIN_CATEGORY_TOGGLED',
        p_entity_type: 'category',
        p_entity_id: categoryId,
        p_after_state: { is_enabled: isEnabled },
      });
      return data as Category;
    }

    const state = readSandbox();
    const cat = state.categories.find((c) => c.id === categoryId);
    if (!cat) throw new Error('Category not found.');
    const before = { is_enabled: cat.is_enabled };
    cat.is_enabled = isEnabled;
    appendSandboxAudit(state, actor, 'ADMIN_CATEGORY_TOGGLED', 'category', categoryId, before, { is_enabled: isEnabled });
    writeSandbox(state);
    return cat;
  },

  async adminAddLocation(
    actor: UserWithRoles,
    payload: { level: LocationNode['level']; parent_id: string | null; name: string; state_code: string | null; pincode: string | null }
  ): Promise<LocationNode> {
    assertAdmin(actor.roles, 'system');
    const cleanName = payload.name.trim();
    if (!cleanName) throw new Error('Location name is required.');
    const slug = `${(payload.state_code || 'in').toLowerCase()}-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 5)}`;

    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('locations')
        .insert({
          country_code: 'IN',
          level: payload.level,
          parent_id: payload.parent_id,
          name: cleanName,
          slug,
          state_code: payload.state_code,
          pincode: payload.pincode || null,
          is_active: true,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await supabase.rpc('record_audit_log', {
        p_action: 'ADMIN_LOCATION_ADDED',
        p_entity_type: 'location',
        p_entity_id: (data as LocationNode).id,
        p_after_state: { name: cleanName, level: payload.level, pincode: payload.pincode },
      });
      return data as LocationNode;
    }

    const state = readSandbox();
    const loc: LocationNode = {
      id: createId('loc'),
      country_code: 'IN',
      level: payload.level,
      parent_id: payload.parent_id,
      name: cleanName,
      slug,
      code: null,
      state_code: payload.state_code,
      pincode: payload.pincode || null,
      latitude: null,
      longitude: null,
      is_active: true,
    };
    state.locations.push(loc);
    appendSandboxAudit(state, actor, 'ADMIN_LOCATION_ADDED', 'location', loc.id, null, { name: cleanName, level: payload.level });
    writeSandbox(state);
    return loc;
  },

  async adminToggleFeatureFlag(actor: UserWithRoles, flagKey: string, isEnabled: boolean): Promise<FeatureFlag> {
    assertAdmin(actor.roles, 'system');
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('feature_flags')
        .update({ is_enabled: isEnabled, updated_by: actor.profile.id })
        .eq('flag_key', flagKey)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await supabase.rpc('record_audit_log', {
        p_action: 'ADMIN_FEATURE_FLAG_TOGGLED',
        p_entity_type: 'feature_flag',
        p_entity_id: flagKey,
        p_after_state: { is_enabled: isEnabled },
      });
      return data as FeatureFlag;
    }

    const state = readSandbox();
    const flag = state.featureFlags.find((f) => f.flag_key === flagKey);
    if (!flag) throw new Error('Feature flag not found.');
    const before = { is_enabled: flag.is_enabled };
    flag.is_enabled = isEnabled;
    appendSandboxAudit(state, actor, 'ADMIN_FEATURE_FLAG_TOGGLED', 'feature_flag', flagKey, before, { is_enabled: isEnabled });
    writeSandbox(state);
    return flag;
  },

  async adminListReports(actorRoles: readonly UserRole[]): Promise<ModerationReport[]> {
    assertAdmin(actorRoles, 'moderation');
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.from('moderation_reports').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as ModerationReport[];
    }
    return [...readSandbox().reports];
  },

  async adminResolveReport(
    actor: UserWithRoles,
    reportId: string,
    status: ModerationReport['status'],
    notes: string
  ): Promise<ModerationReport> {
    assertAdmin(actor.roles, 'moderation');
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('moderation_reports')
        .update({ status, resolution_notes: notes, resolved_by: actor.profile.id, resolved_at: nowIso() })
        .eq('id', reportId)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await supabase.rpc('record_audit_log', {
        p_action: 'ADMIN_REPORT_UPDATED',
        p_entity_type: 'moderation_report',
        p_entity_id: reportId,
        p_after_state: { status },
        p_reason: notes,
      });
      return data as ModerationReport;
    }

    const state = readSandbox();
    const rep = state.reports.find((r) => r.id === reportId);
    if (!rep) throw new Error('Moderation report not found.');
    rep.status = status;
    rep.resolution_notes = notes;
    appendSandboxAudit(state, actor, 'ADMIN_REPORT_UPDATED', 'moderation_report', reportId, null, { status }, notes);
    writeSandbox(state);
    return rep;
  },

  async adminListAuditLogs(actorRoles: readonly UserRole[]): Promise<AuditLogEntry[]> {
    assertAdmin(actorRoles, 'audit');
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);
      return (data ?? []) as AuditLogEntry[];
    }
    return [...readSandbox().auditLogs];
  },
};
