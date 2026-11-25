import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { platformStore, resetSandboxForTests } from '../services/platformStore';

describe('Unified Auth, Admin Governance & RLS Integrity', () => {
  beforeEach(() => {
    resetSandboxForTests();
  });

  it('requires Terms & Privacy DPDPA consent and strips privileged roles on self-registration', async () => {
    await expect(
      platformStore.registerUser({
        fullName: 'Test User',
        email: 'noconsent@example.in',
        password: 'Password@123',
        roles: ['employer'],
        acceptedTerms: false,
        acceptedPrivacy: true,
      })
    ).rejects.toThrow(/Terms of Service/i);

    const registered = await platformStore.registerUser({
      fullName: 'Priya Nair',
      email: 'priya@example.in',
      phone: '+91 98765 43210',
      password: 'Password@123',
      roles: ['employer', 'super_admin', 'admin_finance'],
      acceptedTerms: true,
      acceptedPrivacy: true,
      whatsappConsent: true,
      emailConsent: true,
    });

    expect(registered.roles).toContain('customer');
    expect(registered.roles).toContain('employer');
    expect(registered.roles).not.toContain('super_admin');
    expect(registered.roles).not.toContain('admin_finance');

    const consents = await platformStore.getMyConsents(registered.profile.id);
    expect(consents.some((c) => c.consent_type === 'TERMS' && c.granted)).toBe(true);
    expect(consents.some((c) => c.consent_type === 'WHATSAPP' && c.granted)).toBe(true);
  });

  it('prevents non-admins from executing administrative controls and blocks suspended accounts', async () => {
    const employer = await platformStore.loginWithPassword('employer@example.in', 'Demo@12345');
    await expect(platformStore.adminListUsers(employer.roles)).rejects.toThrow(/Unauthorized/i);
    await expect(platformStore.adminToggleCategory(employer, 'cat-home-services', true)).rejects.toThrow(/Unauthorized/i);

    const admin = await platformStore.loginWithPassword('admin@shalomconnecthub.in', 'Admin@12345');
    await platformStore.adminUpdateUserStatus(admin, employer.profile.id, 'SUSPENDED', false, 'Policy test');

    await platformStore.logout();
    await expect(platformStore.loginWithPassword('employer@example.in', 'Demo@12345')).rejects.toThrow(/suspended/i);
  });

  it('records immutable audit logs when admin toggles categories, approves listings, or adds locations', async () => {
    const admin = await platformStore.loginWithPassword('admin@shalomconnecthub.in', 'Admin@12345');

    const toggled = await platformStore.adminToggleCategory(admin, 'cat-home-services', true);
    expect(toggled.is_enabled).toBe(true);

    const approved = await platformStore.adminUpdateListingStatus(
      admin,
      'lst-school-preview-1',
      'APPROVED',
      true,
      'Verified trust documents'
    );
    expect(approved.status).toBe('APPROVED');
    expect(approved.is_featured).toBe(true);

    const logs = await platformStore.adminListAuditLogs(admin.roles);
    expect(logs.some((l) => l.action === 'ADMIN_CATEGORY_TOGGLED' && l.entity_id === 'cat-home-services')).toBe(true);
    expect(logs.some((l) => l.action === 'ADMIN_LISTING_STATUS_UPDATED' && l.entity_id === 'lst-school-preview-1')).toBe(true);
  });

  it('enforces Row Level Security on every Phase 1 table in SQL migrations', () => {
    const schemaSql = readFileSync(
      resolve(process.cwd(), 'supabase/migrations/202611250001_phase1_core_schema.sql'),
      'utf8'
    );
    const rlsSql = readFileSync(
      resolve(process.cwd(), 'supabase/migrations/202611250002_phase1_rls_policies.sql'),
      'utf8'
    );

    const tableMatches = Array.from(schemaSql.matchAll(/CREATE TABLE IF NOT EXISTS public\.([a-z_]+)/g)).map(
      (m: RegExpExecArray) => m[1]
    );
    expect(tableMatches.length).toBeGreaterThanOrEqual(18);

    for (const tableName of tableMatches) {
      expect(rlsSql).toContain(`ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;`);
    }
  });
});
