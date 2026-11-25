import type { AdminScope, UserRole } from '../types/domain';

export const SELF_ASSIGNABLE_ROLES: readonly UserRole[] = [
  'customer',
  'employer',
  'candidate',
  'property_owner',
  'property_agent',
  'school_admin',
  'service_provider',
  'org_member',
];

export const ADMIN_ROLES: readonly UserRole[] = [
  'admin_moderation',
  'admin_finance',
  'admin_system',
  'super_admin',
];

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Customer / Seeker',
  employer: 'Employer',
  candidate: 'Job Candidate',
  property_owner: 'Property Owner',
  property_agent: 'Property Agent',
  school_admin: 'School Administrator',
  service_provider: 'Service Provider',
  org_member: 'Organisation Member',
  admin_moderation: 'Moderation Admin',
  admin_finance: 'Finance Admin',
  admin_system: 'System Admin',
  super_admin: 'Super Administrator',
};

export function isSelfAssignableRole(role: UserRole): boolean {
  return SELF_ASSIGNABLE_ROLES.includes(role);
}

export function isAdminRole(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export function hasAnyAdminRole(roles: readonly UserRole[]): boolean {
  return roles.some((role) => ADMIN_ROLES.includes(role));
}

export function hasAdminScope(roles: readonly UserRole[], scope: AdminScope): boolean {
  if (roles.includes('super_admin')) {
    return true;
  }
  switch (scope) {
    case 'overview':
    case 'audit':
      return hasAnyAdminRole(roles);
    case 'moderation':
    case 'users':
      return roles.includes('admin_moderation');
    case 'finance':
      return roles.includes('admin_finance');
    case 'system':
      return roles.includes('admin_system');
    default:
      return false;
  }
}

export function getPrimaryDashboardPath(roles: readonly UserRole[]): string {
  if (hasAnyAdminRole(roles)) return '/admin';
  if (roles.includes('employer')) return '/employer';
  if (roles.includes('property_owner') || roles.includes('property_agent')) return '/owner';
  if (roles.includes('school_admin')) return '/school-dashboard';
  return '/dashboard';
}
