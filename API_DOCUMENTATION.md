# API DOCUMENTATION — SHALOM CONNECTHUB INDIA

**Backend Platform**: Supabase (`https://fkjiafpcbgqtnkdonrtb.supabase.co`)  
**Authentication**: Supabase Auth JWT (`Authorization: Bearer <access_token>`) + PostgreSQL Row Level Security (RLS)

---

## 1. Supabase Edge Functions (`supabase/functions/`)

### 1.1 `POST /functions/v1/razorpay-create-order`
Creates a Razorpay payment order server-side after validating consent, idempotency, plan pricing, coupons, and 18% GST.
- **Auth**: Required (User Bearer JWT)
- **Request Body**:
  ```json
  {
    "planCode": "PROFESSIONAL",
    "billingCycle": "MONTHLY",
    "couponCode": "LAUNCH20",
    "idempotencyKey": "idem_usr_1732510000",
    "consentConfirmed": true
  }
  ```
- **Response (`200`)**: `{ "payment": { ... }, "order": { "id": "order_...", "amount": 47100, "currency": "INR" }, "keyId": "rzp_..." }`

### 1.2 `POST /functions/v1/razorpay-verify-payment`
Verifies Razorpay HMAC-SHA256 signature (`razorpay_order_id|razorpay_payment_id`) against `RAZORPAY_KEY_SECRET` and marks `payments.status = 'SUCCEEDED'` idempotently.
- **Request Body**:
  ```json
  {
    "razorpay_order_id": "order_...",
    "razorpay_payment_id": "pay_...",
    "razorpay_signature": "<hex-hmac-sha256>"
  }
  ```
- **Response (`200`)**: `{ "status": "verified" | "already_verified", "payment": { ... } }`

### 1.3 `POST /functions/v1/razorpay-webhook`
Receives Razorpay webhook events (`payment.captured`, `payment.failed`).
- **Headers**: `X-Razorpay-Signature` (verified via HMAC-SHA256 against `RAZORPAY_WEBHOOK_SECRET`)
- **Idempotency**: Checks existing `payments.status` before transitioning state; duplicate deliveries return `{ "ok": true }` without double-crediting.

### 1.4 `POST /functions/v1/automation-worker`
Scheduled job runner processing `automation_jobs` (`PENDING`, `RETRYING`) with retry/backoff (`max_attempts = 3`) and dispatching **Official WhatsApp Business Cloud API** (`graph.facebook.com/v21.0`) template messages using `WHATSAPP_PHONE_ID` and `WHATSAPP_API_TOKEN`.

### 1.5 `POST /functions/v1/ai-gateway`
Server-side Gemini API proxy (`gemini-2.5-flash`) enforcing `ai_settings.is_enabled`, monthly INR spend cap (`monthly_budget_cap_inr`), daily per-user limits, and safety guardrails (never claims property title verification or candidate qualification guarantees).
- **Auth**: Required (User Bearer JWT)
- **Request Body**: `{ "featureKey": "listing_assistant" | "translation" | "candidate_matching" | "property_matching" | "moderation" | "customer_assistant", "prompt": "..." }`

---

## 2. Database RPC Functions
- `public.record_audit_log(p_action, p_entity_type, p_entity_id, p_before_state, p_after_state, p_reason, p_metadata)` — Append-only audit log writer (`SECURITY DEFINER`).
- `public.has_role(p_user_id, p_role)` / `public.has_any_admin_role(p_user_id)` — RLS permission helpers.
- `public.employer_can_view_candidate(p_employer_id, p_candidate_id)` — Enforces private CV isolation.
- `public.can_manage_property(p_user_id, p_property_id)` — Enforces owner & assigned authorised-agent isolation.
- `public.is_school_admin_for(p_user_id, p_school_id)` — Enforces strict cross-school isolation.

---

## 3. Client Service Layer (`src/services/`)
All client services support **Live Supabase mode** (`VITE_SUPABASE_ANON_KEY` configured) and **Local Sandbox mode** (for offline/test execution):
- `platformStore.ts`: Auth, profiles, multi-role, organisations, India locations, categories, feature flags, moderation reports, audit logs.
- `staffStore.ts`: Jobs search/pagination, candidate profiles, educations, experiences, private CVs, applications, shortlisting, recruitment enquiries.
- `propertyStore.ts` & `propertyFormRules.ts`: Dynamic property forms, address privacy masking, owner/agent isolation, visit requests, reporting.
- `schoolStore.ts`: Institutions directory, classes, facilities, admission enquiries, teaching/non-teaching recruitment.
- `financeStore.ts` & `gstInvoice.ts`: Configurable plans, quotes, CGST/SGST vs. IGST + Rupees in Words, Razorpay verification, webhooks, refunds, expiry sweeps.
- `communicationStore.ts`: Common enquiry engine, conversations/messages, consent-checked notifications, rate caps, unanswered enquiry automation.
- `aiService.ts`: Listing assistant, EN/HI/ML detection & translation, matching, moderation flagging, spend caps.
