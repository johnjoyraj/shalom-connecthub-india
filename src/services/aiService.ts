import { BRAND_INFO } from '../data/platformDefaults';
import { getSupabaseClient } from '../lib/supabase';
import type {
  AiFeatureKey,
  AiModerationFlag,
  AiSettings,
  AiTranslationRecord,
  AiUsageLog,
  CandidateMatchResult,
  PropertyMatchResult,
  SupportedLanguageCode,
} from '../types/ai';
import type { UserWithRoles } from '../types/domain';
import type { PropertyPurpose } from '../types/property';
import { hasAdminScope } from './permissions';
import { propertyStore } from './propertyStore';
import { staffStore } from './staffStore';

const AI_SANDBOX_KEY = 'shalom_connecthub_ai_v1';

interface AiSandboxState {
  settings: AiSettings;
  translations: AiTranslationRecord[];
  usageLogs: AiUsageLog[];
  moderationFlags: AiModerationFlag[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return `${prefix}-${rand}`;
}

function buildInitialAiSandbox(): AiSandboxState {
  return {
    settings: {
      is_enabled: true,
      monthly_budget_cap_inr: 800,
      per_user_daily_limit: 25,
      enabled_features: {
        listing_assistant: true,
        translation: true,
        candidate_matching: true,
        property_matching: true,
        moderation: true,
        customer_assistant: true,
      },
    },
    translations: [],
    usageLogs: [],
    moderationFlags: [],
  };
}

let aiMemoryFallback: AiSandboxState | null = null;

function readAiSandbox(): AiSandboxState {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(AI_SANDBOX_KEY);
      if (raw) return JSON.parse(raw) as AiSandboxState;
    } catch {
      // Fallback
    }
  }
  if (!aiMemoryFallback) {
    aiMemoryFallback = buildInitialAiSandbox();
  }
  return aiMemoryFallback;
}

function writeAiSandbox(state: AiSandboxState): void {
  aiMemoryFallback = state;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(AI_SANDBOX_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota
    }
  }
}

export function resetAiSandboxForTests(): void {
  writeAiSandbox(buildInitialAiSandbox());
}

export function detectIndianLanguage(text: string): SupportedLanguageCode {
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml';
  if (/[a-zA-Z]/.test(text)) return 'en';
  return 'unknown';
}

function checkAndLogUsage(
  state: AiSandboxState,
  userId: string,
  featureKey: AiFeatureKey,
  tokens: number,
  costInr: number
): void {
  if (!state.settings.is_enabled || !state.settings.enabled_features[featureKey]) {
    state.usageLogs.unshift({
      id: makeId('aiu'),
      user_id: userId,
      feature_key: featureKey,
      model_name: 'gemini-2.5-flash',
      tokens_used: 0,
      estimated_cost_inr: 0,
      status: 'BLOCKED_DISABLED',
      error_message: `AI feature "${featureKey}" is disabled by administrator.`,
      created_at: nowIso(),
    });
    writeAiSandbox(state);
    throw new Error(`AI feature "${featureKey}" is disabled by administrator.`);
  }

  const monthPrefix = nowIso().slice(0, 7);
  const monthlySpent = state.usageLogs
    .filter((l) => l.status === 'SUCCESS' && l.created_at.startsWith(monthPrefix))
    .reduce((acc, l) => acc + l.estimated_cost_inr, 0);

  if (monthlySpent + costInr > state.settings.monthly_budget_cap_inr) {
    state.usageLogs.unshift({
      id: makeId('aiu'),
      user_id: userId,
      feature_key: featureKey,
      model_name: 'gemini-2.5-flash',
      tokens_used: 0,
      estimated_cost_inr: 0,
      status: 'BLOCKED_CAP',
      error_message: 'Monthly AI spend cap reached.',
      created_at: nowIso(),
    });
    writeAiSandbox(state);
    throw new Error('Monthly AI spend cap reached. Contact Administrator to adjust budget.');
  }

  const todayPrefix = nowIso().slice(0, 10);
  const userTodayCount = state.usageLogs.filter(
    (l) => l.user_id === userId && l.status === 'SUCCESS' && l.created_at.startsWith(todayPrefix)
  ).length;

  if (userTodayCount >= state.settings.per_user_daily_limit) {
    state.usageLogs.unshift({
      id: makeId('aiu'),
      user_id: userId,
      feature_key: featureKey,
      model_name: 'gemini-2.5-flash',
      tokens_used: 0,
      estimated_cost_inr: 0,
      status: 'BLOCKED_CAP',
      error_message: 'Daily per-user AI limit reached.',
      created_at: nowIso(),
    });
    writeAiSandbox(state);
    throw new Error('Daily AI request limit reached for your account.');
  }

  state.usageLogs.unshift({
    id: makeId('aiu'),
    user_id: userId,
    feature_key: featureKey,
    model_name: 'gemini-2.5-flash',
    tokens_used: tokens,
    estimated_cost_inr: costInr,
    status: 'SUCCESS',
    error_message: null,
    created_at: nowIso(),
  });
}

async function invokeLiveAiGateway(
  featureKey: AiFeatureKey,
  prompt: string
): Promise<{ text: string } | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: settingsRow } = await supabase
    .from('ai_settings')
    .select('*')
    .eq('config_key', 'default')
    .maybeSingle();
  if (settingsRow) {
    const s = settingsRow as unknown as AiSettings;
    if (!s.is_enabled) {
      throw new Error('AI features are currently disabled by Platform Administration.');
    }
    if (!s.enabled_features?.[featureKey]) {
      throw new Error(`AI feature "${featureKey}" is currently disabled.`);
    }
  }

  try {
    const { data, error } = await supabase.functions.invoke('ai-gateway', {
      body: { featureKey, prompt },
    });
    if (error) {
      const msg = error.message || '';
      if (/disabled|cap reached|unauthorized|429|403/i.test(msg)) {
        throw new Error(msg);
      }
      return null;
    }
    if (data && typeof (data as { text?: unknown }).text === 'string') {
      return { text: (data as { text: string }).text };
    }
    return null;
  } catch (err) {
    if (err instanceof Error && /disabled|cap reached|unauthorized/i.test(err.message)) {
      throw err;
    }
    return null;
  }
}

export const aiService = {
  async getSettings(): Promise<AiSettings> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('config_key', 'default')
        .maybeSingle();
      if (data) return data as AiSettings;
    }
    return { ...readAiSandbox().settings };
  },

  async updateSettings(actor: UserWithRoles, updates: Partial<AiSettings>): Promise<AiSettings> {
    if (!hasAdminScope(actor.roles, 'system')) {
      throw new Error('Unauthorized: System Admin permission required to configure AI settings.');
    }
    const supabase = getSupabaseClient();
    if (supabase) {
      const current = await this.getSettings();
      const next: AiSettings = {
        ...current,
        ...updates,
        enabled_features: {
          ...current.enabled_features,
          ...(updates.enabled_features ?? {}),
        },
      };
      const { data, error } = await supabase
        .from('ai_settings')
        .upsert({
          config_key: 'default',
          is_enabled: next.is_enabled,
          monthly_budget_cap_inr: next.monthly_budget_cap_inr,
          per_user_daily_limit: next.per_user_daily_limit,
          enabled_features: next.enabled_features,
        }, { onConflict: 'config_key' })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as AiSettings;
    }

    const state = readAiSandbox();
    state.settings = {
      ...state.settings,
      ...updates,
      enabled_features: {
        ...state.settings.enabled_features,
        ...(updates.enabled_features ?? {}),
      },
    };
    writeAiSandbox(state);
    return state.settings;
  },

  async generateProfessionalListing(
    user: UserWithRoles,
    input: { module: 'staff' | 'property' | 'school'; rawNotes: string }
  ): Promise<{
    suggestedTitle: string;
    suggestedSummary: string;
    suggestedDescription: string;
    requiresHumanReview: boolean;
    disclaimer: string;
  }> {
    if (!input.rawNotes.trim()) throw new Error('Enter basic listing notes first.');
    const clean = input.rawNotes.trim();
    const gw = await invokeLiveAiGateway(
      'listing_assistant',
      `Create a clear, professional ${input.module} marketplace listing for India based on these notes:\n${clean}`
    );
    if (gw) {
      const lines = gw.text.split(/\r?\n/).filter((l) => l.trim());
      return {
        suggestedTitle: (lines[0] || `${input.module.toUpperCase()} Listing`).slice(0, 80),
        suggestedSummary: (lines[1] || clean.slice(0, 120)).slice(0, 180),
        suggestedDescription: gw.text,
        requiresHumanReview: true,
        disclaimer:
          'AI-generated text must be reviewed by you before publishing. AI does not verify legal property titles, statutory approvals, or qualifications.',
      };
    }

    const state = readAiSandbox();
    checkAndLogUsage(state, user.profile.id, 'listing_assistant', 320, 0.05);
    writeAiSandbox(state);

    const prefix =
      input.module === 'staff'
        ? 'Hiring Opportunity'
        : input.module === 'property'
        ? 'Verified Property Listing'
        : 'Educational Institution Profile';

    return {
      suggestedTitle: `${prefix}: ${clean.slice(0, 68)}${clean.length > 68 ? '...' : ''}`,
      suggestedSummary: `Professionally structured ${input.module} listing — ${clean.slice(0, 120)}`,
      suggestedDescription: `${clean}\n\nKey Highlights:\n• Clear location and category details across India\n• Direct platform enquiry support\n• Subject to standard Shalom ConnectHub India listing guidelines`,
      requiresHumanReview: true,
      disclaimer:
        'AI-generated text must be reviewed by you before publishing. AI does not verify legal property titles, statutory approvals, or qualifications.',
    };
  },

  async detectAndTranslateText(
    user: UserWithRoles,
    input: { entityType: string; entityId: string; text: string }
  ): Promise<AiTranslationRecord> {
    const original = input.text.trim();
    if (!original) throw new Error('Text to translate cannot be empty.');

    const detected = detectIndianLanguage(original);
    const supabase = getSupabaseClient();
    if (supabase) {
      const gw = await invokeLiveAiGateway(
        'translation',
        `Translate the following text into English (en), Hindi (hi), and Malayalam (ml). Reply ONLY with JSON {"en":"...","hi":"...","ml":"..."}:\n${original}`
      );
      let translations = {
        en: detected === 'en' ? original : `[EN] ${original}`,
        hi: detected === 'hi' ? original : `[हिन्दी अनुवाद] ${original}`,
        ml: detected === 'ml' ? original : `[മലയാളം വിവർത്തനം] ${original}`,
      };
      if (gw) {
        try {
          const jsonMatch = gw.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as Partial<typeof translations>;
            translations = {
              en: parsed.en || translations.en,
              hi: parsed.hi || translations.hi,
              ml: parsed.ml || translations.ml,
            };
          }
        } catch {
          // keep clean fallback
        }
      }
      const { data: saved } = await supabase
        .from('ai_translations')
        .upsert(
          {
            entity_type: input.entityType,
            entity_id: input.entityId,
            original_language: detected,
            original_text: original,
            translations,
          },
          { onConflict: 'entity_type,entity_id' }
        )
        .select('*')
        .maybeSingle();
      if (saved) return saved as AiTranslationRecord;
    }

    const state = readAiSandbox();
    checkAndLogUsage(state, user.profile.id, 'translation', 280, 0.04);

    const record: AiTranslationRecord = {
      id: makeId('aitr'),
      entity_type: input.entityType,
      entity_id: input.entityId,
      original_language: detected,
      original_text: original, // Original submitted text preserved intact
      translations: {
        en: detected === 'en' ? original : `[EN] ${original}`,
        hi: detected === 'hi' ? original : `[हिन्दी अनुवाद] ${original}`,
        ml: detected === 'ml' ? original : `[മലയാളം വിവർത്തനം] ${original}`,
      },
      created_at: nowIso(),
    };

    state.translations = [
      record,
      ...state.translations.filter(
        (t) => !(t.entity_type === input.entityType && t.entity_id === input.entityId)
      ),
    ];
    writeAiSandbox(state);
    return record;
  },

  async matchCandidatesToJob(
    user: UserWithRoles,
    jobPostId: string
  ): Promise<CandidateMatchResult[]> {
    const state = readAiSandbox();
    checkAndLogUsage(state, user.profile.id, 'candidate_matching', 360, 0.06);
    writeAiSandbox(state);

    const [{ items: jobs }, candidates] = await Promise.all([
      staffStore.searchJobs({ includeUnapproved: true }),
      staffStore.searchCandidates({}),
    ]);
    const job = jobs.find((j) => j.id === jobPostId);
    if (!job) throw new Error('Job post not found.');

    return candidates
      .map((cand) => {
        let score = 20;
        const reasons: string[] = [];
        const matchedSkills = cand.skills.filter((s) =>
          job.skills_required.some((req) => req.toLowerCase() === s.toLowerCase())
        );
        if (matchedSkills.length > 0) {
          score += Math.min(45, matchedSkills.length * 15);
          reasons.push(`Matched skills: ${matchedSkills.join(', ')}`);
        }
        if (cand.total_experience_years >= job.min_experience_years) {
          score += 20;
          reasons.push(`Experience ${cand.total_experience_years} yrs meets ${job.min_experience_years}+ yrs`);
        }
        if (cand.highest_qualification.toLowerCase() === job.qualification_required.toLowerCase()) {
          score += 15;
          reasons.push(`Qualification matches (${cand.highest_qualification})`);
        }
        return {
          candidate_id: cand.id,
          full_name: cand.full_name,
          headline: cand.headline,
          score: Math.min(100, score),
          reasons: reasons.length ? reasons : ['General profile fit'],
          disclaimer: 'AI match score is advisory only and does NOT guarantee candidate qualifications.',
        };
      })
      .sort((a, b) => b.score - a.score);
  },

  async matchPropertiesToRequirements(
    user: UserWithRoles,
    input: { purpose: PropertyPurpose | 'ALL'; maxBudget?: number; preferredCity?: string; keywords?: string }
  ): Promise<PropertyMatchResult[]> {
    const state = readAiSandbox();
    checkAndLogUsage(state, user.profile.id, 'property_matching', 340, 0.05);
    writeAiSandbox(state);

    const { items } = await propertyStore.searchProperties({});
    const cityQ = input.preferredCity?.trim().toLowerCase() ?? '';
    const keyQ = input.keywords?.trim().toLowerCase() ?? '';

    return items
      .map((prop) => {
        let score = 25;
        const reasons: string[] = [];
        if (input.purpose === 'ALL' || prop.purpose === input.purpose) {
          score += 25;
          reasons.push(`Matches purpose (${prop.purpose})`);
        }
        const price = prop.purpose === 'SALE' ? prop.sale_price ?? 0 : prop.monthly_rent ?? 0;
        if (!input.maxBudget || price <= input.maxBudget) {
          score += 25;
          reasons.push(`Within budget (₹${price.toLocaleString('en-IN')})`);
        }
        if (cityQ && prop.city_name.toLowerCase().includes(cityQ)) {
          score += 15;
          reasons.push(`Located in ${prop.city_name}`);
        }
        if (keyQ && `${prop.title} ${prop.description}`.toLowerCase().includes(keyQ)) {
          score += 10;
          reasons.push('Matches description requirements');
        }
        return {
          property_id: prop.id,
          title: prop.title,
          city_name: prop.city_name,
          score: Math.min(100, score),
          reasons,
          disclaimer: 'AI matching does NOT verify legal property title or RERA compliance.',
        };
      })
      .sort((a, b) => b.score - a.score);
  },

  async moderateListingContent(
    user: UserWithRoles,
    input: { listingId?: string | null; title: string; description: string; existingTitles?: string[] }
  ): Promise<AiModerationFlag> {
    const state = readAiSandbox();
    checkAndLogUsage(state, user.profile.id, 'moderation', 220, 0.03);

    const reasons: string[] = [];
    const combined = `${input.title} ${input.description}`.toLowerCase();

    if (input.existingTitles?.some((t) => t.trim().toLowerCase() === input.title.trim().toLowerCase())) {
      reasons.push('Potential duplicate advertisement title detected');
    }
    if (/advance fee|wire money|send otp|guaranteed visa|100% job guarantee|lottery/.test(combined)) {
      reasons.push('Suspicious / potential fraud solicitation keywords');
    }
    if (input.description.trim().length < 20) {
      reasons.push('Missing essential listing description details');
    }

    const severity: AiModerationFlag['severity'] =
      reasons.some((r) => r.includes('fraud')) ? 'HIGH' : reasons.length > 0 ? 'MEDIUM' : 'LOW';

    const flag: AiModerationFlag = {
      id: makeId('aiflag'),
      listing_id: input.listingId ?? null,
      subject_text: input.title,
      severity,
      flag_reasons: reasons.length ? reasons : ['No major policy risks detected'],
      ai_summary:
        reasons.length > 0
          ? `Flagged for human moderator review (${reasons.length} issue(s)).`
          : 'Automated screen clean; subject to standard moderation.',
      requires_human_review: severity !== 'LOW',
      status: severity === 'LOW' ? 'REVIEWED' : 'OPEN',
      created_at: nowIso(),
    };
    state.moderationFlags.unshift(flag);
    writeAiSandbox(state);
    return flag;
  },

  async askPlatformAssistant(user: UserWithRoles, question: string): Promise<string> {
    const rawQ = question.trim();
    const q = rawQ.toLowerCase();
    if (!q) throw new Error('Please enter a question.');

    const gw = await invokeLiveAiGateway('customer_assistant', rawQ);
    if (gw) {
      return gw.text;
    }

    const state = readAiSandbox();
    checkAndLogUsage(state, user.profile.id, 'customer_assistant', 200, 0.03);
    writeAiSandbox(state);

    if (q.includes('price') || q.includes('plan') || q.includes('subscription')) {
      return `SHALOM CONNECTHUB INDIA offers configurable plans starting with Free (₹0/mo for 1 active listing), Starter (₹199/mo), Professional (₹499/mo), Business (₹999/mo), and Premium (₹1,999/mo), processed securely via Razorpay & UPI with GST invoices.`;
    }
    if (q.includes('title') || q.includes('legal') || q.includes('verify')) {
      return `Uploaded property documents are reviewed for submission completeness only and NEVER constitute legal property title verification. Always perform independent legal due diligence.`;
    }
    if (q.includes('delete') || q.includes('privacy') || q.includes('dpdpa')) {
      return `You can manage notification consent or submit a formal Account Deletion Request anytime under Dashboard → Settings. Statutory grievance email: ${BRAND_INFO.grievanceEmail}.`;
    }
    return `Welcome to ${BRAND_INFO.name}! You can use one unified account for Staff Connect, Property Connect, and School Connect across all 28 Indian States & 8 UTs. Ask about plans, privacy, or listing steps anytime.`;
  },

  async getAdminOverview(actor: UserWithRoles): Promise<{
    settings: AiSettings;
    usageLogs: AiUsageLog[];
    moderationFlags: AiModerationFlag[];
    translations: AiTranslationRecord[];
    monthlySpentInr: number;
  }> {
    if (!hasAdminScope(actor.roles, 'system') && !hasAdminScope(actor.roles, 'moderation')) {
      throw new Error('Unauthorized: Admin access required.');
    }
    const supabase = getSupabaseClient();
    if (supabase) {
      const [settings, logsRes, flagsRes, transRes] = await Promise.all([
        this.getSettings(),
        supabase.from('ai_usage_logs').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('ai_moderation_flags').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('ai_translations').select('*').order('created_at', { ascending: false }).limit(50),
      ]);
      const usageLogs = (logsRes.data ?? []) as AiUsageLog[];
      const monthPrefix = nowIso().slice(0, 7);
      const monthlySpentInr = usageLogs
        .filter((l) => l.status === 'SUCCESS' && l.created_at.startsWith(monthPrefix))
        .reduce((acc, l) => acc + Number(l.estimated_cost_inr || 0), 0);
      return {
        settings,
        usageLogs,
        moderationFlags: (flagsRes.data ?? []) as AiModerationFlag[],
        translations: (transRes.data ?? []) as AiTranslationRecord[],
        monthlySpentInr: Math.round(monthlySpentInr * 10000) / 10000,
      };
    }

    const state = readAiSandbox();
    const monthPrefix = nowIso().slice(0, 7);
    const monthlySpentInr = state.usageLogs
      .filter((l) => l.status === 'SUCCESS' && l.created_at.startsWith(monthPrefix))
      .reduce((acc, l) => acc + l.estimated_cost_inr, 0);

    return {
      settings: state.settings,
      usageLogs: state.usageLogs,
      moderationFlags: state.moderationFlags,
      translations: state.translations,
      monthlySpentInr: Math.round(monthlySpentInr * 10000) / 10000,
    };
  },
};
