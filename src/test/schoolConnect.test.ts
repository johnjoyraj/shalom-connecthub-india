import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { platformStore, resetSandboxForTests } from '../services/platformStore';
import { resetSchoolSandboxForTests, schoolStore } from '../services/schoolStore';

describe('Phase 4: School Connect Module', () => {
  beforeEach(() => {
    resetSandboxForTests();
    resetSchoolSandboxForTests();
  });

  it('filters institutions by type, board, classes, facilities, and Indian location', async () => {
    const all = await schoolStore.searchSchools();
    expect(all).toHaveLength(3);

    const preschools = await schoolStore.searchSchools({ institutionType: 'PRESCHOOL', locationId: 'loc-state-kl' });
    expect(preschools).toHaveLength(1);
    expect(preschools[0].name).toContain('Little Sprouts');

    const cbseSchools = await schoolStore.searchSchools({ board: 'CBSE', className: 'Class XI', facility: 'Labs' });
    expect(cbseSchools).toHaveLength(1);
    expect(cbseSchools[0].slug).toBe('grace-model-public-school-gorakhpur');
  });

  it('enforces strict cross-school isolation between different school administrators', async () => {
    const schoolAdmin1 = await platformStore.loginWithPassword('school@example.in', 'Demo@12345');

    // School Admin 1 CAN access their own school (sch-1) enquiries
    const sch1Enquiries = await schoolStore.getSchoolAdmissionEnquiries(schoolAdmin1, 'sch-1');
    expect(sch1Enquiries.length).toBeGreaterThanOrEqual(1);

    // School Admin 1 MUST BE DENIED access to School 2 (sch-2) enquiries, classes, and updates
    await expect(schoolStore.getSchoolAdmissionEnquiries(schoolAdmin1, 'sch-2')).rejects.toThrow(/Unauthorized/i);
    await expect(
      schoolStore.updateAdmissionEnquiry(schoolAdmin1, 'admenq-2', 'ADMITTED', 'Unauthorized cross-school attempt')
    ).rejects.toThrow(/Unauthorized/i);
    await expect(
      schoolStore.addSchoolFacility(schoolAdmin1, 'sch-2', 'Unauthorized Facility')
    ).rejects.toThrow(/Unauthorized/i);
  });

  it('supports admission enquiries, teaching/non-teaching recruitment, and school profile loading', async () => {
    const parent = await platformStore.loginWithPassword('owner@example.in', 'Demo@12345');
    const enq = await schoolStore.submitAdmissionEnquiry(parent, {
      schoolId: 'sch-1',
      studentName: 'Hannah Mathew',
      applyingForClass: 'Class IV',
      academicYear: '2027-28',
      contactPhone: '+91 98000 00103',
      message: 'Enquiring about CBSE Class IV admission.',
    });
    expect(enq.status).toBe('NEW');

    const schoolAdmin1 = await platformStore.loginWithPassword('school@example.in', 'Demo@12345');
    const updated = await schoolStore.updateAdmissionEnquiry(
      schoolAdmin1,
      enq.id,
      'INTERVIEW_SCHEDULED',
      'Parent interaction scheduled on Friday.'
    );
    expect(updated.status).toBe('INTERVIEW_SCHEDULED');

    const vac = await schoolStore.addSchoolVacancy(schoolAdmin1, 'sch-1', {
      staff_category: 'NON_TEACHING',
      title: 'School Nurse / Wellness Coordinator',
      subject_or_department: 'Health & Safety',
      qualification_required: 'B.Sc Nursing / GNM',
      employment_type: 'FULL_TIME',
      salary_range_label: '₹20,000 – ₹28,000 / month',
    });
    expect(vac.staff_category).toBe('NON_TEACHING');

    const details = await schoolStore.getSchoolDetailsBySlug('grace-model-public-school-gorakhpur');
    expect(details).not.toBeNull();
    expect(details!.vacancies.some((v) => v.title.includes('Nurse'))).toBe(true);
  });

  it('enforces Row Level Security on all 6 Phase 4 School Connect tables in SQL', () => {
    const sql = readFileSync(
      resolve(process.cwd(), 'supabase/migrations/202611250006_phase4_school_connect.sql'),
      'utf8'
    );
    const tables = Array.from(sql.matchAll(/CREATE TABLE IF NOT EXISTS public\.([a-z_]+)/g)).map(
      (m: RegExpExecArray) => m[1]
    );
    expect(tables).toHaveLength(6);
    for (const table of tables) {
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    }
  });
});
