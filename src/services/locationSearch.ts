import type { LocationNode } from '../types/domain';

export function formatLocationBreadcrumb(
  locationId: string | null | undefined,
  locations: readonly LocationNode[]
): string {
  if (!locationId) return 'All India';
  const byId = new Map(locations.map((loc) => [loc.id, loc]));
  const parts: string[] = [];
  let current = byId.get(locationId);
  let guard = 0;

  while (current && guard < 8) {
    if (current.level !== 'COUNTRY') {
      parts.unshift(current.pincode ? `${current.name} (${current.pincode})` : current.name);
    }
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
    guard += 1;
  }

  return parts.length > 0 ? parts.join(', ') : 'All India';
}

export function getDescendantLocationIds(
  rootLocationId: string,
  locations: readonly LocationNode[]
): Set<string> {
  const result = new Set<string>([rootLocationId]);
  let added = true;

  while (added) {
    added = false;
    for (const loc of locations) {
      if (loc.parent_id && result.has(loc.parent_id) && !result.has(loc.id)) {
        result.add(loc.id);
        added = true;
      }
    }
  }
  return result;
}

export function searchLocations(
  locations: readonly LocationNode[],
  query: string,
  stateCode?: string
): LocationNode[] {
  const q = query.trim().toLowerCase();
  return locations.filter((loc) => {
    if (!loc.is_active) return false;
    if (stateCode && loc.state_code !== stateCode) return false;
    if (!q) return true;
    return (
      loc.name.toLowerCase().includes(q) ||
      (loc.pincode?.includes(q) ?? false) ||
      (loc.state_code?.toLowerCase().includes(q) ?? false)
    );
  });
}

export function isValidIndianPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}
