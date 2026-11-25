import { beforeEach, describe, expect, it } from 'vitest';
import { INDIA_LOCATIONS_SEED } from '../data/indiaLocationsSeed';
import { formatLocationBreadcrumb, isValidIndianPincode, searchLocations } from '../services/locationSearch';
import { platformStore, resetSandboxForTests } from '../services/platformStore';

describe('All-India Location Engine & Search', () => {
  beforeEach(() => {
    resetSandboxForTests();
  });

  it('seeds India root plus all 28 States and 8 Union Territories (36 total)', () => {
    const states = INDIA_LOCATIONS_SEED.filter((l) => l.level === 'STATE');
    expect(states).toHaveLength(36);
    expect(states.some((s) => s.name === 'Kerala' && s.state_code === 'KL')).toBe(true);
    expect(states.some((s) => s.name === 'Uttar Pradesh' && s.state_code === 'UP')).toBe(true);
    expect(states.some((s) => s.name === 'Delhi (NCT)' && s.state_code === 'DL')).toBe(true);
  });

  it('validates Indian 6-digit PIN codes accurately', () => {
    expect(isValidIndianPincode('682001')).toBe(true);
    expect(isValidIndianPincode('273001')).toBe(true);
    expect(isValidIndianPincode('012345')).toBe(false);
    expect(isValidIndianPincode('68200')).toBe(false);
  });

  it('searches locations by city, state code, or PIN code and formats breadcrumbs', () => {
    const kochiMatches = searchLocations(INDIA_LOCATIONS_SEED, '682001');
    expect(kochiMatches.some((l) => l.name === 'Kochi')).toBe(true);
    const breadcrumb = formatLocationBreadcrumb('loc-city-in-kl-kochi', INDIA_LOCATIONS_SEED);
    expect(breadcrumb).toContain('Kochi (682001)');
    expect(breadcrumb).toContain('Kerala');
  });

  it('filters approved listings by State hierarchy and PIN code without returning unapproved listings', async () => {
    const keralaResults = await platformStore.searchListings({ locationId: 'loc-state-kl' });
    expect(keralaResults.length).toBe(1);
    expect(keralaResults[0].module_key).toBe('property');

    // School preview listing is PENDING_REVIEW so public search must exclude it
    const upResults = await platformStore.searchListings({ locationId: 'loc-state-up' });
    expect(upResults).toHaveLength(0);

    const pinResults = await platformStore.searchListings({ pincode: '560001' });
    expect(pinResults).toHaveLength(1);
    expect(pinResults[0].module_key).toBe('staff');
  });
});
