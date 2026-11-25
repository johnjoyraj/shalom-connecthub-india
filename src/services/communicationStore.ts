import type {
  AutomationJob,
  ChatMessage,
  CommonEnquiry,
  CommonEnquiryStatus,
  Conversation,
  NotificationChannel,
  NotificationItem,
  NotificationLog,
  NotificationTemplate,
  UserNotificationPreferences,
} from '../types/communication';
import type { Listing, UserWithRoles } from '../types/domain';
import { hasAdminScope, hasAnyAdminRole } from './permissions';
import { platformStore } from './platformStore';

const COMM_SANDBOX_KEY = 'shalom_connecthub_comm_v1';

interface CommSandboxState {
  enquiries: CommonEnquiry[];
  conversations: Conversation[];
  messages: ChatMessage[];
  notifications: NotificationItem[];
  templates: NotificationTemplate[];
  logs: NotificationLog[];
  jobs: AutomationJob[];
  prefsByUser: Record<string, UserNotificationPreferences>;
  dailyChannelCap: number;
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

function buildInitialCommSandbox(): CommSandboxState {
  const templates: NotificationTemplate[] = [
    {
      id: 'tpl-1',
      template_key: 'welcome_user',
      channel: 'EMAIL',
      subject: 'Welcome to SHALOM CONNECTHUB INDIA',
      body_template: 'Hello {{name}}, welcome to Shalom ConnectHub India.',
      whatsapp_template_name: 'welcome_connecthub',
      is_active: true,
    },
    {
      id: 'tpl-2',
      template_key: 'new_enquiry_owner',
      channel: 'WHATSAPP',
      subject: 'New Marketplace Enquiry',
      body_template: 'New enquiry on {{listing_title}} from {{customer_name}}.',
      whatsapp_template_name: 'new_enquiry_alert',
      is_active: true,
    },
    {
      id: 'tpl-3',
      template_key: 'payment_receipt',
      channel: 'EMAIL',
      subject: 'Payment Receipt & GST Invoice',
      body_template: 'Invoice {{invoice_number}} for INR {{amount}} issued.',
      whatsapp_template_name: 'payment_confirmation',
      is_active: true,
    },
    {
      id: 'tpl-4',
      template_key: 'unanswered_enquiry_reminder',
      channel: 'PUSH',
      subject: 'Unanswered Enquiry Reminder',
      body_template: 'You have an unanswered enquiry on {{listing_title}}.',
      whatsapp_template_name: null,
      is_active: true,
    },
  ];

  const enquiries: CommonEnquiry[] = [
    {
      id: 'enq-seed-1',
      customer_id: 'usr-property-owner',
      customer_name: 'Thomas Mathew (Owner)',
      listing_id: 'lst-staff-preview-1',
      listing_title: 'Senior Full-Stack Engineer (React & PostgreSQL) — Bengaluru',
      owner_id: 'usr-employer-demo',
      module_key: 'staff',
      subject: 'Role & Team Size Query',
      message: 'Is this role part of the core platform engineering team in Bengaluru?',
      status: 'NEW',
      feedback_rating: null,
      feedback_comment: null,
      last_owner_response_at: null,
      created_at: '2026-11-23T10:00:00Z',
      updated_at: '2026-11-23T10:00:00Z',
    },
  ];

  const conversations: Conversation[] = [
    {
      id: 'conv-seed-1',
      enquiry_id: 'enq-seed-1',
      customer_id: 'usr-property-owner',
      owner_id: 'usr-employer-demo',
      listing_id: 'lst-staff-preview-1',
      listing_title: 'Senior Full-Stack Engineer (React & PostgreSQL) — Bengaluru',
      status: 'OPEN',
      created_at: '2026-11-23T10:00:00Z',
    },
  ];

  const messages: ChatMessage[] = [
    {
      id: 'msg-seed-1',
      conversation_id: 'conv-seed-1',
      sender_id: 'usr-property-owner',
      sender_name: 'Thomas Mathew (Owner)',
      body: 'Is this role part of the core platform engineering team in Bengaluru?',
      is_read: false,
      created_at: '2026-11-23T10:00:00Z',
    },
  ];

  return {
    enquiries,
    conversations,
    messages,
    notifications: [],
    templates,
    logs: [],
    jobs: [],
    prefsByUser: {
      'usr-employer-demo': { email: true, whatsapp: true, push: true },
      'usr-property-owner': { email: true, whatsapp: false, push: true },
      'usr-school-admin': { email: true, whatsapp: true, push: false },
    },
    dailyChannelCap: 50,
  };
}

let commMemoryFallback: CommSandboxState | null = null;

function readCommSandbox(): CommSandboxState {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(COMM_SANDBOX_KEY);
      if (raw) return JSON.parse(raw) as CommSandboxState;
    } catch {
      // Fallback
    }
  }
  if (!commMemoryFallback) {
    commMemoryFallback = buildInitialCommSandbox();
  }
  return commMemoryFallback;
}

function writeCommSandbox(state: CommSandboxState): void {
  commMemoryFallback = state;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(COMM_SANDBOX_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota
    }
  }
}

export function resetCommunicationSandboxForTests(): void {
  writeCommSandbox(buildInitialCommSandbox());
}

function dispatchInternal(
  state: CommSandboxState,
  input: {
    userId: string;
    recipient: string;
    channel: NotificationChannel;
    eventType: string;
    title: string;
    body: string;
    dedupKey: string;
  }
): { notification: NotificationItem | null; log: NotificationLog; deduplicated: boolean } {
  // Prevent duplicate notifications
  const existingNotif = state.notifications.find((n) => n.dedup_key === input.dedupKey);
  if (existingNotif) {
    const existingLog =
      state.logs.find((l) => l.notification_id === existingNotif.id) ??
      ({
        id: makeId('nlog'),
        notification_id: existingNotif.id,
        user_id: input.userId,
        channel: input.channel,
        recipient: input.recipient,
        provider: 'DEDUP_CACHE',
        status: 'SENT',
        provider_message_id: null,
        error_message: null,
        cost_estimate_inr: 0,
        created_at: nowIso(),
      } as NotificationLog);
    return { notification: existingNotif, log: existingLog, deduplicated: true };
  }

  const prefs = state.prefsByUser[input.userId] ?? { email: true, whatsapp: false, push: false };
  const hasConsent =
    input.channel === 'IN_APP' ||
    (input.channel === 'EMAIL' && prefs.email) ||
    (input.channel === 'WHATSAPP' && prefs.whatsapp) ||
    (input.channel === 'PUSH' && prefs.push);

  if (!hasConsent) {
    const skippedLog: NotificationLog = {
      id: makeId('nlog'),
      notification_id: null,
      user_id: input.userId,
      channel: input.channel,
      recipient: input.recipient,
      provider: input.channel === 'WHATSAPP' ? 'META_WHATSAPP_CLOUD_API' : input.channel,
      status: 'SKIPPED_NO_CONSENT',
      provider_message_id: null,
      error_message: `User has not opted in to ${input.channel} notifications.`,
      cost_estimate_inr: 0,
      created_at: nowIso(),
    };
    state.logs.unshift(skippedLog);
    return { notification: null, log: skippedLog, deduplicated: false };
  }

  const todayPrefix = nowIso().slice(0, 10);
  const sentToday = state.logs.filter(
    (l) =>
      l.channel === input.channel &&
      l.status === 'SENT' &&
      l.created_at.startsWith(todayPrefix)
  ).length;

  if (input.channel !== 'IN_APP' && sentToday >= state.dailyChannelCap) {
    const rateLog: NotificationLog = {
      id: makeId('nlog'),
      notification_id: null,
      user_id: input.userId,
      channel: input.channel,
      recipient: input.recipient,
      provider: input.channel,
      status: 'SKIPPED_RATE_LIMIT',
      provider_message_id: null,
      error_message: `Daily cap (${state.dailyChannelCap}) reached for ${input.channel}.`,
      cost_estimate_inr: 0,
      created_at: nowIso(),
    };
    state.logs.unshift(rateLog);
    return { notification: null, log: rateLog, deduplicated: false };
  }

  const notif: NotificationItem = {
    id: makeId('notif'),
    user_id: input.userId,
    channel: input.channel,
    event_type: input.eventType,
    title: input.title,
    body: input.body,
    is_read: false,
    dedup_key: input.dedupKey,
    created_at: nowIso(),
  };
  state.notifications.unshift(notif);

  const cost = input.channel === 'WHATSAPP' ? 0.78 : input.channel === 'EMAIL' ? 0.05 : 0;
  const log: NotificationLog = {
    id: makeId('nlog'),
    notification_id: notif.id,
    user_id: input.userId,
    channel: input.channel,
    recipient: input.recipient,
    provider:
      input.channel === 'WHATSAPP'
        ? 'META_WHATSAPP_CLOUD_API_V21'
        : input.channel === 'EMAIL'
        ? 'TRANSACTIONAL_SMTP'
        : input.channel === 'PUSH'
        ? 'FCM_PUSH'
        : 'IN_APP',
    status: 'SENT',
    provider_message_id: `msg_${Math.random().toString(36).slice(2, 10)}`,
    error_message: null,
    cost_estimate_inr: cost,
    created_at: nowIso(),
  };
  state.logs.unshift(log);
  return { notification: notif, log, deduplicated: false };
}

export const communicationStore = {
  async getPreferences(userId: string): Promise<UserNotificationPreferences> {
    const state = readCommSandbox();
    return state.prefsByUser[userId] ?? { email: true, whatsapp: false, push: false };
  },

  async updatePreferences(
    userId: string,
    prefs: UserNotificationPreferences
  ): Promise<UserNotificationPreferences> {
    const state = readCommSandbox();
    state.prefsByUser[userId] = { ...prefs };
    writeCommSandbox(state);
    await platformStore.recordConsent(userId, 'EMAIL', prefs.email);
    await platformStore.recordConsent(userId, 'WHATSAPP', prefs.whatsapp);
    await platformStore.recordConsent(userId, 'PUSH', prefs.push);
    return prefs;
  },

  async submitCommonEnquiry(
    customer: UserWithRoles,
    input: { listingId: string; subject: string; message: string }
  ): Promise<{ enquiry: CommonEnquiry; conversation: Conversation }> {
    if (!input.message.trim()) throw new Error('Enquiry message is required.');
    const allListings = await platformStore.searchListings({ includeUnapproved: true });
    const listing: Listing | undefined = allListings.find((l) => l.id === input.listingId);

    // Step 2 of enquiry automation: validate listing availability
    if (!listing || listing.status !== 'APPROVED') {
      throw new Error('This listing is currently unavailable for enquiries.');
    }

    const state = readCommSandbox();
    const ts = nowIso();
    const enquiry: CommonEnquiry = {
      id: makeId('enq'),
      customer_id: customer.profile.id,
      customer_name: customer.profile.full_name,
      listing_id: listing.id,
      listing_title: listing.title,
      owner_id: listing.owner_id,
      module_key: listing.module_key,
      subject: input.subject.trim() || `Enquiry on ${listing.title}`,
      message: input.message.trim(),
      status: 'NEW',
      feedback_rating: null,
      feedback_comment: null,
      last_owner_response_at: null,
      created_at: ts,
      updated_at: ts,
    };
    state.enquiries.unshift(enquiry);

    const conversation: Conversation = {
      id: makeId('conv'),
      enquiry_id: enquiry.id,
      customer_id: customer.profile.id,
      owner_id: listing.owner_id,
      listing_id: listing.id,
      listing_title: listing.title,
      status: 'OPEN',
      created_at: ts,
    };
    state.conversations.unshift(conversation);
    state.messages.push({
      id: makeId('msg'),
      conversation_id: conversation.id,
      sender_id: customer.profile.id,
      sender_name: customer.profile.full_name,
      body: enquiry.message,
      is_read: false,
      created_at: ts,
    });

    // Notify listing owner & confirm to customer (deduplicated + consent-checked)
    dispatchInternal(state, {
      userId: listing.owner_id,
      recipient: listing.owner_id,
      channel: 'IN_APP',
      eventType: 'NEW_ENQUIRY',
      title: `New Enquiry: ${listing.title}`,
      body: `${customer.profile.full_name}: ${enquiry.message}`,
      dedupKey: `enq-owner-inapp-${enquiry.id}`,
    });
    dispatchInternal(state, {
      userId: listing.owner_id,
      recipient: listing.owner_id,
      channel: 'WHATSAPP',
      eventType: 'NEW_ENQUIRY',
      title: `New Enquiry: ${listing.title}`,
      body: `New enquiry from ${customer.profile.full_name}.`,
      dedupKey: `enq-owner-wa-${enquiry.id}`,
    });
    dispatchInternal(state, {
      userId: customer.profile.id,
      recipient: customer.profile.email,
      channel: 'EMAIL',
      eventType: 'ENQUIRY_CONFIRMATION',
      title: `Enquiry Submitted: ${listing.title}`,
      body: 'Your enquiry has been sent to the listing owner.',
      dedupKey: `enq-cust-email-${enquiry.id}`,
    });

    writeCommSandbox(state);
    return { enquiry, conversation };
  },

  async getMyEnquiries(user: UserWithRoles): Promise<CommonEnquiry[]> {
    const state = readCommSandbox();
    if (hasAnyAdminRole(user.roles)) {
      return [...state.enquiries];
    }
    return state.enquiries.filter(
      (e) => e.customer_id === user.profile.id || e.owner_id === user.profile.id
    );
  },

  async updateEnquiryStatus(
    user: UserWithRoles,
    enquiryId: string,
    status: CommonEnquiryStatus
  ): Promise<CommonEnquiry> {
    const state = readCommSandbox();
    const enq = state.enquiries.find((e) => e.id === enquiryId);
    if (!enq) throw new Error('Enquiry not found.');
    const allowed =
      enq.owner_id === user.profile.id ||
      (enq.customer_id === user.profile.id && (status === 'CANCELLED' || status === 'CLOSED')) ||
      hasAnyAdminRole(user.roles);
    if (!allowed) {
      throw new Error('Unauthorized: cannot update this enquiry status.');
    }
    enq.status = status;
    enq.updated_at = nowIso();
    if (enq.owner_id === user.profile.id) {
      enq.last_owner_response_at = enq.updated_at;
    }
    writeCommSandbox(state);
    return enq;
  },

  async submitEnquiryFeedback(
    customer: UserWithRoles,
    enquiryId: string,
    rating: number,
    comment: string
  ): Promise<CommonEnquiry> {
    if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5.');
    const state = readCommSandbox();
    const enq = state.enquiries.find((e) => e.id === enquiryId);
    if (!enq || enq.customer_id !== customer.profile.id) {
      throw new Error('Unauthorized: only the enquiry customer may submit feedback.');
    }
    enq.feedback_rating = rating;
    enq.feedback_comment = comment.trim() || null;
    enq.updated_at = nowIso();
    writeCommSandbox(state);
    return enq;
  },

  async getMyConversations(user: UserWithRoles): Promise<{
    conversations: Conversation[];
    messages: ChatMessage[];
  }> {
    const state = readCommSandbox();
    const convs = state.conversations.filter(
      (c) => c.customer_id === user.profile.id || c.owner_id === user.profile.id || hasAnyAdminRole(user.roles)
    );
    const convIds = new Set(convs.map((c) => c.id));
    return {
      conversations: convs,
      messages: state.messages.filter((m) => convIds.has(m.conversation_id)),
    };
  },

  async sendConversationMessage(
    sender: UserWithRoles,
    conversationId: string,
    body: string
  ): Promise<ChatMessage> {
    if (!body.trim()) throw new Error('Message text cannot be empty.');
    const state = readCommSandbox();
    const conv = state.conversations.find((c) => c.id === conversationId);
    if (!conv) throw new Error('Conversation not found.');
    if (conv.customer_id !== sender.profile.id && conv.owner_id !== sender.profile.id) {
      throw new Error('Unauthorized: you are not a participant in this conversation.');
    }

    const msg: ChatMessage = {
      id: makeId('msg'),
      conversation_id: conversationId,
      sender_id: sender.profile.id,
      sender_name: sender.profile.full_name,
      body: body.trim(),
      is_read: false,
      created_at: nowIso(),
    };
    state.messages.push(msg);

    const enq = state.enquiries.find((e) => e.id === conv.enquiry_id);
    if (enq && sender.profile.id === enq.owner_id) {
      enq.last_owner_response_at = msg.created_at;
      if (enq.status === 'NEW' || enq.status === 'VIEWED') {
        enq.status = 'CONTACTED';
      }
    }

    const recipientId = sender.profile.id === conv.customer_id ? conv.owner_id : conv.customer_id;
    dispatchInternal(state, {
      userId: recipientId,
      recipient: recipientId,
      channel: 'PUSH',
      eventType: 'NEW_MESSAGE',
      title: `New Message from ${sender.profile.full_name}`,
      body: msg.body.slice(0, 120),
      dedupKey: `msg-push-${msg.id}`,
    });

    writeCommSandbox(state);
    return msg;
  },

  async getMyNotifications(userId: string): Promise<NotificationItem[]> {
    return readCommSandbox().notifications.filter((n) => n.user_id === userId);
  },

  async dispatchNotification(input: {
    userId: string;
    recipient: string;
    channel: NotificationChannel;
    eventType: string;
    title: string;
    body: string;
    dedupKey: string;
  }) {
    const state = readCommSandbox();
    const res = dispatchInternal(state, input);
    writeCommSandbox(state);
    return res;
  },

  async setDailyChannelCapForTesting(cap: number): Promise<void> {
    const state = readCommSandbox();
    state.dailyChannelCap = cap;
    writeCommSandbox(state);
  },

  // --------------------------------------------------------------------------
  // Automation Queue & Scheduled Sweep (Unanswered Enquiries + Retries)
  // --------------------------------------------------------------------------
  async enqueueAutomationJob(
    jobType: string,
    dedupKey: string,
    payload: Record<string, unknown>
  ): Promise<{ job: AutomationJob; deduplicated: boolean }> {
    const state = readCommSandbox();
    const existing = state.jobs.find((j) => j.dedup_key === dedupKey);
    if (existing) {
      return { job: existing, deduplicated: true };
    }
    const job: AutomationJob = {
      id: makeId('jobq'),
      job_type: jobType,
      dedup_key: dedupKey,
      payload,
      status: 'PENDING',
      attempts: 0,
      max_attempts: 3,
      last_error: null,
      created_at: nowIso(),
    };
    state.jobs.unshift(job);
    writeCommSandbox(state);
    return { job, deduplicated: false };
  },

  async runAutomationSweep(referenceNow = new Date()): Promise<{
    unansweredEnquiriesQueued: number;
    jobsCompleted: number;
    jobsRetrying: number;
    jobsFailed: number;
  }> {
    const state = readCommSandbox();
    let unansweredEnquiriesQueued = 0;

    for (const enq of state.enquiries) {
      const ageHours = (referenceNow.getTime() - new Date(enq.created_at).getTime()) / (60 * 60 * 1000);
      if (enq.status === 'NEW' && !enq.last_owner_response_at && ageHours >= 24) {
        const dedup = `unanswered-enq-${enq.id}`;
        if (!state.jobs.some((j) => j.dedup_key === dedup)) {
          state.jobs.unshift({
            id: makeId('jobq'),
            job_type: 'UNANSWERED_ENQUIRY_REMINDER',
            dedup_key: dedup,
            payload: { enquiryId: enq.id, ownerId: enq.owner_id, listingTitle: enq.listing_title },
            status: 'PENDING',
            attempts: 0,
            max_attempts: 3,
            last_error: null,
            created_at: referenceNow.toISOString(),
          });
          unansweredEnquiriesQueued += 1;
        }
      }
    }

    let jobsCompleted = 0;
    let jobsRetrying = 0;
    let jobsFailed = 0;

    for (const job of state.jobs) {
      if (job.status !== 'PENDING' && job.status !== 'RETRYING') continue;
      try {
        if (job.payload.simulateTransientError) {
          throw new Error('Simulated provider timeout');
        }
        if (job.job_type === 'UNANSWERED_ENQUIRY_REMINDER') {
          dispatchInternal(state, {
            userId: String(job.payload.ownerId),
            recipient: String(job.payload.ownerId),
            channel: 'IN_APP',
            eventType: 'UNANSWERED_ENQUIRY',
            title: 'Unanswered Enquiry Reminder',
            body: `Please respond to enquiry on ${String(job.payload.listingTitle)}.`,
            dedupKey: `notif-${job.dedup_key}`,
          });
        }
        job.attempts += 1;
        job.status = 'COMPLETED';
        jobsCompleted += 1;
      } catch (err) {
        job.attempts += 1;
        job.last_error = err instanceof Error ? err.message : String(err);
        if (job.attempts >= job.max_attempts) {
          job.status = 'FAILED';
          jobsFailed += 1;
        } else {
          job.status = 'RETRYING';
          jobsRetrying += 1;
        }
      }
    }

    writeCommSandbox(state);
    return { unansweredEnquiriesQueued, jobsCompleted, jobsRetrying, jobsFailed };
  },

  async adminGetNotificationOverview(actor: UserWithRoles): Promise<{
    templates: NotificationTemplate[];
    logs: NotificationLog[];
    jobs: AutomationJob[];
    enquiries: CommonEnquiry[];
  }> {
    if (!hasAdminScope(actor.roles, 'system') && !hasAdminScope(actor.roles, 'moderation')) {
      throw new Error('Unauthorized: Admin access required.');
    }
    const state = readCommSandbox();
    return {
      templates: state.templates,
      logs: state.logs,
      jobs: state.jobs,
      enquiries: state.enquiries,
    };
  },
};
