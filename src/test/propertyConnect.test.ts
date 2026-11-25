import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { platformStore, resetSandboxForTests } from '../services/platformStore';
import { getPropertyFormConfig } from '../services/propertyFormRules';
import {
  getDisplayAddress,
  NON_LEGAL_TITLE_DISCLAIMER,
  propertyStore,
  resetPropertySandboxForTests,
} from '../services/propertyStore';

describe('Phase 3: Property Connect Module', () => {
  beforeEach(() => {
    resetSandboxForTests();
    resetPropertySandboxForTests();
  });

  it('dynamically adapts form fields based on property type and purpose', () => {
    const flatRent = getPropertyFormConfig('APARTMENT_FLAT', 'RENT');
    expect(flatRent.showBedroomsBathrooms).toBe(true);
    expect(flatRent.showRentAndDeposit).toBe(true);
    expect(flatRent.showSalePrice).toBe(false);

    const agriLease = getPropertyFormConfig('AGRICULTURAL_LAND', 'LEASE');
    expect(agriLease.showBedroomsBathrooms).toBe(false);
    expect(agriLease.showLeaseDuration).toBe(true);
    expect(agriLease.allowedAreaUnits).toContain('ACRE');
    expect(agriLease.allowedPurposes).not.toContain('RENT');

    const pgRent = getPropertyFormConfig('HOSTEL_PG', 'RENT');
    expect(pgRent.showPgFields).toBe(true);
    expect(pgRent.showBedroomsBathrooms).toBe(false);
  });

  it('masks private full street addresses for public viewers while showing them to authorised listers', async () => {
    const res = await propertyStore.searchProperties({ pincode: '273001' });
    expect(res.items).toHaveLength(1);
    const shop = res.items[0];

    const publicDisplay = getDisplayAddress(shop, null);
    expect(publicDisplay).not.toContain('Shop 14');
    expect(publicDisplay).toContain('273001');

    const owner = await platformStore.loginWithPassword('owner@example.in', 'Demo@12345');
    const ownerDisplay = getDisplayAddress(shop, owner);
    expect(ownerDisplay).toContain('Shop 14');
  });

  it('enforces property owner and authorised agent isolation for documents and updates', async () => {
    const owner = await platformStore.loginWithPassword('owner@example.in', 'Demo@12345');
    const docs = await propertyStore.getPropertyDocuments(owner, 'prop-1');
    expect(docs).toHaveLength(1);
    expect(docs[0].disclaimer_text).toBe(NON_LEGAL_TITLE_DISCLAIMER);

    // Register a property agent NOT assigned to prop-2
    const otherAgent = await platformStore.registerUser({
      fullName: 'Unassigned Agent',
      email: 'unassigned.agent@example.in',
      password: 'Password@123',
      roles: ['property_agent'],
      acceptedTerms: true,
      acceptedPrivacy: true,
    });

    await expect(propertyStore.getPropertyDocuments(otherAgent, 'prop-1')).rejects.toThrow(/Unauthorized/i);
    await expect(propertyStore.updatePropertyStatus(otherAgent, 'prop-2', 'PAUSED')).rejects.toThrow(/Unauthorized/i);

    // Register an assigned agent matching prop-1's authorised_agent_id ('usr-agent-demo') or create an agent-owned property
    const agentProp = await propertyStore.createPropertyListing(otherAgent, {
      title: '2 BHK Flat in Pune (Agent Managed)',
      description: 'Agent managed residential apartment',
      property_type: 'APARTMENT_FLAT',
      purpose: 'RENT',
      is_resale: false,
      lister_role: 'AUTHORISED_AGENT',
      location_id: 'loc-city-in-mh-pune',
      state_name: 'Maharashtra',
      district_name: 'Pune District',
      city_name: 'Pune',
      pincode: '411001',
      locality: 'Kothrud',
      full_address: 'Flat 301, Kothrud, Pune 411001',
      address_privacy: 'CITY_LOCALITY_ONLY',
      area_value: 1100,
      area_unit: 'SQ_FT',
      bedrooms: 2,
      bathrooms: 2,
      furnishing: 'SEMI_FURNISHED',
      sale_price: null,
      monthly_rent: 24000,
      security_deposit: 60000,
      lease_duration_months: null,
      is_negotiable: true,
      amenities: ['Parking'],
    });
    expect(agentProp.lister_role).toBe('AUTHORISED_AGENT');
  });

  it('supports visit requests, owner replies, and property moderation reporting', async () => {
    const seeker = await platformStore.loginWithPassword('employer@example.in', 'Demo@12345');
    const enq = await propertyStore.submitPropertyEnquiry(seeker, {
      propertyId: 'prop-2',
      enquiryType: 'VISIT_REQUEST',
      preferredVisitDate: '2026-12-05',
      message: 'Interested in inspecting the shop.',
    });
    expect(enq.status).toBe('NEW');

    const owner = await platformStore.loginWithPassword('owner@example.in', 'Demo@12345');
    const confirmed = await propertyStore.updatePropertyEnquiry(owner, enq.id, 'VISIT_CONFIRMED', 'Confirmed for 11 AM.');
    expect(confirmed.status).toBe('VISIT_CONFIRMED');

    const report = await propertyStore.reportProperty(seeker, 'prop-2', 'Price clarification needed', 'Testing report');
    expect(report.status).toBe('OPEN');
  });

  it('enforces Row Level Security on all 7 Phase 3 Property Connect tables in SQL', () => {
    const sql = readFileSync(
      resolve(process.cwd(), 'supabase/migrations/202611250005_phase3_property_connect.sql'),
      'utf8'
    );
    const tables = Array.from(sql.matchAll(/CREATE TABLE IF NOT EXISTS public\.([a-z_]+)/g)).map(
      (m: RegExpExecArray) => m[1]
    );
    expect(tables).toHaveLength(7);
    for (const table of tables) {
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    }
  });
});
