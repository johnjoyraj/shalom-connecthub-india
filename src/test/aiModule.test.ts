import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { aiService, detectIndianLanguage, resetAiSandboxForTests } from '../services/aiService';
import { platformStore, resetSandboxForTests } from '../services/platformStore';

describe('Phase 7: Independent AI Automation Module', () => {
  beforeEach(() => {
    resetSandboxForTests();
    resetAiSandboxForTests();
  });

  it('detects English, Hindi, and Malayalam and preserves original text separately', async () => {
    expect(detectIndianLanguage('2 BHK apartment in Kochi')).toBe('en');
    expect(detectIndianLanguage('गोरखपुर में स्कूल प्रवेश खुला है')).toBe('hi');
    expect(detectIndianLanguage('കൊച്ചിയിൽ 3 BHK ഫ്ലാറ്റ് വാടകയ്ക്ക്')).toBe('ml');

    const user = await platformStore.loginWithPassword('school@example.in', 'Demo@12345');
    const tr = await aiService.detectAndTranslateText(user, {
      entityType: 'school',
      entityId: 'sch-1',
      text: 'गोरखपुर में प्रवेश खुला है',
    });

    expect(tr.original_language).toBe('hi');
    expect(tr.original_text).toBe('गोरखपुर में प्रवेश खुला है');
    expect(tr.translations.hi).toBe('गोरखपुर में प्रवेश खुला है');
    expect(tr.translations.en).toContain('गोरखपुर में प्रवेश खुला है');
    expect(tr.translations.ml).toContain('गोरखपुर में प्रवेश खुला है');
  });

  it('generates listing drafts, candidate/property matches with disclaimers, and moderation flags', async () => {
    const employer = await platformStore.loginWithPassword('employer@example.in', 'Demo@12345');

    const draft = await aiService.generateProfessionalListing(employer, {
      module: 'staff',
      rawNotes: 'Hiring React TypeScript engineer in Bengaluru with 2+ years experience',
    });
    expect(draft.requiresHumanReview).toBe(true);
    expect(draft.disclaimer).toMatch(/does not verify/i);

    const candMatches = await aiService.matchCandidatesToJob(employer, 'job-1');
    expect(candMatches[0].score).toBeGreaterThan(50);
    expect(candMatches[0].disclaimer).toMatch(/does NOT guarantee/i);

    const propMatches = await aiService.matchPropertiesToRequirements(employer, {
      purpose: 'RENT',
      maxBudget: 35000,
      preferredCity: 'Kochi',
    });
    expect(propMatches[0].disclaimer).toMatch(/does NOT verify legal property title/i);

    const flag = await aiService.moderateListingContent(employer, {
      title: 'Send OTP and advance fee for 100% job guarantee',
      description: 'Short',
      existingTitles: ['Send OTP and advance fee for 100% job guarantee'],
    });
    expect(flag.severity).toBe('HIGH');
    expect(flag.requires_human_review).toBe(true);
    expect(flag.flag_reasons.length).toBeGreaterThanOrEqual(2);
  });

  it('enforces admin feature toggles and monthly INR spend caps', async () => {
    const admin = await platformStore.loginWithPassword('admin@shalomconnecthub.in', 'Admin@12345');
    const user = await platformStore.loginWithPassword('owner@example.in', 'Demo@12345');

    // Enforce tight spend cap of ₹0.01 -> second/first ₹0.03 call gets blocked
    await aiService.updateSettings(admin, { monthly_budget_cap_inr: 0.01 });
    await expect(aiService.askPlatformAssistant(user, 'What are the pricing plans?')).rejects.toThrow(/spend cap/i);

    // Restore cap and disable master switch
    await aiService.updateSettings(admin, { monthly_budget_cap_inr: 800, is_enabled: false });
    await expect(aiService.askPlatformAssistant(user, 'What are the pricing plans?')).rejects.toThrow(/disabled/i);

    const overview = await aiService.getAdminOverview(admin);
    expect(overview.usageLogs.some((l) => l.status === 'BLOCKED_CAP')).toBe(true);
    expect(overview.usageLogs.some((l) => l.status === 'BLOCKED_DISABLED')).toBe(true);
  });

  it('enforces Row Level Security on all 4 Phase 7 AI tables in SQL', () => {
    const sql = readFileSync(
      resolve(process.cwd(), 'supabase/migrations/202611250009_phase7_ai_module.sql'),
      'utf8'
    );
    const tables = Array.from(sql.matchAll(/CREATE TABLE IF NOT EXISTS public\.([a-z_]+)/g)).map(
      (m: RegExpExecArray) => m[1]
    );
    expect(tables).toHaveLength(4);
    for (const table of tables) {
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    }
  });
});
