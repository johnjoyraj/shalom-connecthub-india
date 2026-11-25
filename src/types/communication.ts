import type { ModuleKey } from './domain';

export type CommonEnquiryStatus =
  | 'NEW'
  | 'VIEWED'
  | 'CONTACTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CLOSED';

export type NotificationChannel = 'IN_APP' | 'WHATSAPP' | 'EMAIL' | 'PUSH';

export type NotificationLogStatus =
  | 'QUEUED'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'SKIPPED_NO_CONSENT'
  | 'SKIPPED_RATE_LIMIT';

export interface CommonEnquiry {
  id: string;
  customer_id: string;
  customer_name: string;
  listing_id: string;
  listing_title: string;
  owner_id: string;
  module_key: ModuleKey;
  subject: string;
  message: string;
  status: CommonEnquiryStatus;
  feedback_rating: number | null;
  feedback_comment: string | null;
  last_owner_response_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  enquiry_id: string;
  customer_id: string;
  owner_id: string;
  listing_id: string;
  listing_title: string;
  status: 'OPEN' | 'CLOSED';
  created_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  channel: NotificationChannel;
  event_type: string;
  title: string;
  body: string;
  is_read: boolean;
  dedup_key: string | null;
  created_at: string;
}

export interface NotificationTemplate {
  id: string;
  template_key: string;
  channel: NotificationChannel;
  subject: string;
  body_template: string;
  whatsapp_template_name: string | null;
  is_active: boolean;
}

export interface NotificationLog {
  id: string;
  notification_id: string | null;
  user_id: string;
  channel: NotificationChannel;
  recipient: string;
  provider: string;
  status: NotificationLogStatus;
  provider_message_id: string | null;
  error_message: string | null;
  cost_estimate_inr: number;
  created_at: string;
}

export interface AutomationJob {
  id: string;
  job_type: string;
  dedup_key: string;
  payload: Record<string, unknown>;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING';
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  created_at: string;
}

export interface UserNotificationPreferences {
  email: boolean;
  whatsapp: boolean;
  push: boolean;
}
