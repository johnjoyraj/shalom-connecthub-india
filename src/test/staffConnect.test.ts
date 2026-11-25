import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { platformStore, resetSandboxForTests } from '../services/platformStore';
import { resetStaffSandboxForTests, staffStore } from '../services/staffStore';

describe('Phase 2: Staff Connect Module', () => {
  beforeEach(() => {
    resetSandboxForTests();
    resetStaffSandboxForTests();
  });

  it('filters job vacancies by employment type, qualification, skills, salary, and India location', async () => {
    const allOpen = await staffStore.searchJobs();
    expect(allOpen.total).toBe(3);

    const partTime = await staffStore.searchJobs({ employmentType: 'PART_TIME' });
    expect(partTime.items).toHaveLength(1);
    expect(partTime.items[0].title).toContain('Computer Science');

    const keralaJobs = await staffStore.searchJobs({ locationId: 'loc-state-kl' });
    expect(keralaJobs.items).toHaveLength(1);
    expect(keralaJobs.items[0].employment_type).toBe('CONTRACT');

    const highSalary = await staffStore.searchJobs({ minSalary: 80000 });
    expect(highSalary.items).toHaveLength(1);
    expect(highSalary.items[0].skills_required).toContain('React');
  });

  it('enforces employer role for posting vacancies and prevents duplicate applications', async () => {
    const ownerUser = await platformStore.loginWithPassword('owner@example.in', 'Demo@12345');

    // Property owner without employer role cannot create a job post
    await expect(
      staffStore.createJobPost(ownerUser, {
        title: 'Unauthorized Job',
        summary: 'Should fail',
        description: 'Should fail',
        location_id: null,
        employment_type: 'FULL_TIME',
        work_mode: 'ONSITE',
        min_experience_years: 0,
        max_experience_years: null,
        qualification_required: 'Graduate',
        skills_required: [],
        salary_min: null,
        salary_max: null,
        salary_period: 'MONTHLY',
        openings_count: 1,
      })
    ).rejects.toThrow(/Unauthorized/i);

    // Register a new candidate, upload CV, apply, and block duplicate apply
    const candidate = await platformStore.registerUser({
      fullName: 'Arjun Menon',
      email: 'arjun.cand@example.in',
      password: 'Password@123',
      roles: ['candidate'],
      acceptedTerms: true,
      acceptedPrivacy: true,
    });

    const cv = await staffStore.uploadCandidateCv(candidate, {
      name: 'Arjun_Menon_CV.pdf',
      size: 120_000,
      type: 'application/pdf',
    });
    expect(cv.is_primary_cv).toBe(true);

    const application = await staffStore.applyToJob(candidate, 'job-2', {
      coverNote: 'Experienced CBSE Python instructor.',
      cvDocumentId: cv.id,
    });
    expect(application.status).toBe('APPLIED');

    await expect(
      staffStore.applyToJob(candidate, 'job-2', { coverNote: 'Duplicate' })
    ).rejects.toThrow(/already applied/i);

    // Unrelated employer (usr-employer-demo did NOT receive job-2 application; job-2 belongs to usr-school-admin)
    const unrelatedEmployer = await platformStore.loginWithPassword('employer@example.in', 'Demo@12345');
    await expect(staffStore.getAuthorizedCvDocument(unrelatedEmployer, cv.id)).rejects.toThrow(/Unauthorized/i);

    // Hiring school admin for job-2 IS authorized to access Arjun's CV and shortlist him
    const schoolAdmin = await platformStore.loginWithPassword('school@example.in', 'Demo@12345');
    const authorizedCv = await staffStore.getAuthorizedCvDocument(schoolAdmin, cv.id);
    expect(authorizedCv.file_name).toBe('Arjun_Menon_CV.pdf');

    const shortlisted = await staffStore.updateApplicationStatus(schoolAdmin, application.id, 'SHORTLISTED', 'Strong teaching fit');
    expect(shortlisted.status).toBe('SHORTLISTED');
  });

  it('supports recruitment enquiries and employer replies', async () => {
    const candidate = await platformStore.loginWithPassword('owner@example.in', 'Demo@12345');
    const enquiry = await staffStore.sendRecruitmentEnquiry(candidate, {
      jobPostId: 'job-1',
      employerId: 'usr-employer-demo',
      subject: 'Remote flexibility',
      message: 'Is hybrid 2 days onsite possible?',
    });
    expect(enquiry.status).toBe('NEW');

    const employer = await platformStore.loginWithPassword('employer@example.in', 'Demo@12345');
    const replied = await staffStore.replyToRecruitmentEnquiry(employer, enquiry.id, 'Yes, 2 days onsite per week.');
    expect(replied.status).toBe('CONTACTED');
    expect(replied.employer_reply).toContain('2 days onsite');
  });

  it('enforces Row Level Security on all 9 Phase 2 Staff Connect tables in SQL', () => {
    const sql = readFileSync(
      resolve(process.cwd(), 'supabase/migrations/202611250004_phase2_staff_connect.sql'),
      'utf8'
    );
    const tables = Array.from(sql.matchAll(/CREATE TABLE IF NOT EXISTS public\.([a-z_]+)/g)).map(
      (m: RegExpExecArray) => m[1]
    );
    expect(tables).toHaveLength(9);
    for (const table of tables) {
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    }
  });
});
