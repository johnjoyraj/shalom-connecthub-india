export type AiFeatureKey =
  | 'listing_assistant'
  | 'translation'
  | 'candidate_matching'
  | 'property_matching'
  | 'moderation'
  | 'customer_assistant';

export type SupportedLanguageCode = 'en' | 'hi' | 'ml' | 'unknown';

export interface AiSettings {
  is_enabled: boolean;
  monthly_budget_cap_inr: number;
  per_user_daily_limit: number;
  enabled_features: Record<AiFeatureKey, boolean>;
}

export interface AiTranslationRecord {
  id: string;
  entity_type: string;
  entity_id: string;
  original_language: SupportedLanguageCode;
  original_text: string;
  translations: {
    en: string;
    hi: string;
    ml: string;
  };
  created_at: string;
}

export interface AiUsageLog {
  id: string;
  user_id: string;
  feature_key: AiFeatureKey;
  model_name: string;
  tokens_used: number;
  estimated_cost_inr: number;
  status: 'SUCCESS' | 'BLOCKED_CAP' | 'BLOCKED_DISABLED' | 'ERROR';
  error_message: string | null;
  created_at: string;
}

export interface AiModerationFlag {
  id: string;
  listing_id: string | null;
  subject_text: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  flag_reasons: string[];
  ai_summary: string;
  requires_human_review: boolean;
  status: 'OPEN' | 'REVIEWED' | 'DISMISSED';
  created_at: string;
}

export interface CandidateMatchResult {
  candidate_id: string;
  full_name: string;
  headline: string;
  score: number;
  reasons: string[];
  disclaimer: string;
}

export interface PropertyMatchResult {
  property_id: string;
  title: string;
  city_name: string;
  score: number;
  reasons: string[];
  disclaimer: string;
}
