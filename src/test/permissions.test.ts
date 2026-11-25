import { describe, expect, it } from 'vitest';
import {
  getPrimaryDashboardPath,
  hasAdminScope,
  hasAnyAdminRole,
  isAdminRole,
  isSelfAssignableRole,
} from '../services/permissions';

describe('RBAC & Role Permissions', () => {
  it('separates self-assignable marketplace roles from admin roles', () => {
    expect(isSelfAssignableRole('employer')).toBe(true);
    expect(isSelfAssignableRole('property_owner')).toBe(true);
    expect(isSelfAssignableRole('school_admin')).toBe(true);
    expect(isSelfAssignableRole('super_admin')).toBe(false);
    expect(isSelfAssignableRole('admin_finance')).toBe(false);
    expect(isAdminRole('admin_moderation')).toBe(true);
    expect(isAdminRole('customer')).toBe(false);
  });

  it('enforces scoped admin permissions without leaking cross-scope privileges', () => {
    expect(hasAdminScope(['admin_moderation'], 'moderation')).toBe(true);
    expect(hasAdminScope(['admin_moderation'], 'finance')).toBe(false);
    expect(hasAdminScope(['admin_moderation'], 'system')).toBe(false);

    expect(hasAdminScope(['admin_finance'], 'finance')).toBe(true);
    expect(hasAdminScope(['admin_finance'], 'users')).toBe(false);

    expect(hasAdminScope(['admin_system'], 'system')).toBe(true);
    expect(hasAdminScope(['super_admin'], 'finance')).toBe(true);
    expect(hasAdminScope(['super_admin'], 'system')).toBe(true);
    expect(hasAdminScope(['customer', 'employer'], 'overview')).toBe(false);
  });

  it('resolves primary dashboard paths by role', () => {
    expect(hasAnyAdminRole(['super_admin'])).toBe(true);
    expect(getPrimaryDashboardPath(['super_admin'])).toBe('/admin');
    expect(getPrimaryDashboardPath(['customer', 'employer'])).toBe('/employer');
    expect(getPrimaryDashboardPath(['customer', 'property_owner'])).toBe('/owner');
    expect(getPrimaryDashboardPath(['customer', 'school_admin'])).toBe('/school-dashboard');
    expect(getPrimaryDashboardPath(['customer'])).toBe('/dashboard');
  });
});
