import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { communicationStore, resetCommunicationSandboxForTests } from '../services/communicationStore';
import { platformStore, resetSandboxForTests } from '../services/platformStore';

describe('Phase 6: Common Enquiry, Notifications & Automation Engine', () => {
  beforeEach(() => {
    resetSandboxForTests();
    resetCommunicationSandboxForTests();
  });

  it('validates listing availability, creates enquiry & conversation, and isolates messages', async () => {
    const customer = await platformStore.loginWithPassword('owner@example.in', 'Demo@12345');

    // Unapproved listing lst-school-preview-1 must reject enquiries
    await expect(
      communicationStore.submitCommonEnquiry(customer, {
        listingId: 'lst-school-preview-1',
        subject: 'Admission query',
        message: 'Testing unapproved gate',
      })
    ).rejects.toThrow(/unavailable/i);

    // Approved listing lst-staff-preview-1 succeeds
    const { enquiry, conversation } = await communicationStore.submitCommonEnquiry(customer, {
      listingId: 'lst-staff-preview-1',
      subject: 'Job schedule query',
      message: 'Is Bengaluru hybrid flexible?',
    });
    expect(enquiry.status).toBe('NEW');

    // Unrelated user (school admin) cannot send messages into this conversation
    const outsider = await platformStore.loginWithPassword('school@example.in', 'Demo@12345');
    await expect(
      communicationStore.sendConversationMessage(outsider, conversation.id, 'Intrusion attempt')
    ).rejects.toThrow(/Unauthorized/i);

    // Owner responds -> auto-moves enquiry to CONTACTED
    const owner = await platformStore.loginWithPassword('employer@example.in', 'Demo@12345');
    await communicationStore.sendConversationMessage(owner, conversation.id, 'Yes, 3 days onsite.');
    const ownerEnquiries = await communicationStore.getMyEnquiries(owner);
    expect(ownerEnquiries.find((e) => e.id === enquiry.id)?.status).toBe('CONTACTED');
  });

  it('enforces notification consent, deduplication, and daily cost-control rate caps', async () => {
    // usr-property-owner has whatsapp: false by default
    const noConsent = await communicationStore.dispatchNotification({
      userId: 'usr-property-owner',
      recipient: '+91 98000 00103',
      channel: 'WHATSAPP',
      eventType: 'TEST_ALERT',
      title: 'Alert',
      body: 'Hello',
      dedupKey: 'wa-noconsent-1',
    });
    expect(noConsent.log.status).toBe('SKIPPED_NO_CONSENT');

    // usr-employer-demo has whatsapp: true -> first sends, second deduplicates
    const first = await communicationStore.dispatchNotification({
      userId: 'usr-employer-demo',
      recipient: '+91 98000 00101',
      channel: 'WHATSAPP',
      eventType: 'TEST_ALERT',
      title: 'Alert',
      body: 'Hello',
      dedupKey: 'wa-dedup-1',
    });
    expect(first.log.status).toBe('SENT');
    expect(first.deduplicated).toBe(false);

    const dup = await communicationStore.dispatchNotification({
      userId: 'usr-employer-demo',
      recipient: '+91 98000 00101',
      channel: 'WHATSAPP',
      eventType: 'TEST_ALERT',
      title: 'Alert',
      body: 'Hello',
      dedupKey: 'wa-dedup-1',
    });
    expect(dup.deduplicated).toBe(true);

    // Daily cap enforcement
    await communicationStore.setDailyChannelCapForTesting(1);
    const capped = await communicationStore.dispatchNotification({
      userId: 'usr-employer-demo',
      recipient: '+91 98000 00101',
      channel: 'WHATSAPP',
      eventType: 'TEST_ALERT_2',
      title: 'Alert 2',
      body: 'Cap check',
      dedupKey: 'wa-cap-2',
    });
    expect(capped.log.status).toBe('SKIPPED_RATE_LIMIT');
  });

  it('runs unanswered enquiry reminders and retries failed automation jobs with failure logging', async () => {
    // enq-seed-1 was created 2026-11-23T10:00:00Z -> sweeping at 2026-11-25 queues reminder
    const sweep1 = await communicationStore.runAutomationSweep(new Date('2026-11-25T12:00:00Z'));
    expect(sweep1.unansweredEnquiriesQueued).toBe(1);
    expect(sweep1.jobsCompleted).toBe(1);

    // Enqueue a failing job and verify retry -> failed after 3 attempts
    const { job } = await communicationStore.enqueueAutomationJob('WHATSAPP_NOTIFY', 'fail-job-1', {
      simulateTransientError: true,
    });
    expect(job.status).toBe('PENDING');

    const s1 = await communicationStore.runAutomationSweep();
    expect(s1.jobsRetrying).toBe(1);
    const s2 = await communicationStore.runAutomationSweep();
    expect(s2.jobsRetrying).toBe(1);
    const s3 = await communicationStore.runAutomationSweep();
    expect(s3.jobsFailed).toBe(1);

    const admin = await platformStore.loginWithPassword('admin@shalomconnecthub.in', 'Admin@12345');
    const overview = await communicationStore.adminGetNotificationOverview(admin);
    const failedJob = overview.jobs.find((j) => j.dedup_key === 'fail-job-1');
    expect(failedJob?.status).toBe('FAILED');
    expect(failedJob?.last_error).toContain('Simulated provider timeout');
  });

  it('enforces Row Level Security on all 8 Phase 6 tables in SQL', () => {
    const sql = readFileSync(
      resolve(process.cwd(), 'supabase/migrations/202611250008_phase6_enquiries_and_automation.sql'),
      'utf8'
    );
    const tables = Array.from(sql.matchAll(/CREATE TABLE IF NOT EXISTS public\.([a-z_]+)/g)).map(
      (m: RegExpExecArray) => m[1]
    );
    expect(tables).toHaveLength(8);
    for (const table of tables) {
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    }
  });
});
