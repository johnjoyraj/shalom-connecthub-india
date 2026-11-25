# SECURITY GUIDE — SHALOM CONNECTHUB INDIA

## 1. Defense-in-Depth Controls Verified Across Phases 1–10
1. **100% Row Level Security Coverage**: Automated test `src/test/securityAudit.test.ts` verifies every PostgreSQL table across all 9 SQL migrations (`202611250001`–`202611250009`) executes `ENABLE ROW LEVEL SECURITY`.
2. **Server-Side Secret Isolation**:
   - Browser bundle receives only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `WHATSAPP_API_TOKEN`, and `GEMINI_API_KEY` reside exclusively in Supabase Edge Function secrets (`securityAudit.test.ts` scans both `src/` and `dist/`).
3. **Module-Specific Privacy Isolation**:
   - **Staff Connect**: Candidate CVs in `candidate_documents` / `private-documents` are readable strictly by the candidate, employers they applied to, and moderation/super admins.
   - **Property Connect**: `property_locations` masks `full_address` in public views per `address_privacy`; property agents can only access properties where `authorised_agent_id = auth.uid()`; `property_documents` carry mandatory non-legal-title disclaimers.
   - **School Connect**: `is_school_admin_for` isolates `admission_enquiries`, `school_classes`, `school_facilities`, and `school_staff_vacancies` per institution.
4. **Payment & Webhook Integrity**:
   - Payments are verified server-side via HMAC-SHA256 (`razorpay-verify-payment`, `razorpay-webhook`) with idempotency keys and zero card-data storage.
5. **PWA Cache Safety**:
   - Service Worker `public/sw.js` and `src/services/pwaCacheRules.ts` never cache `/dashboard`, `/admin`, `/employer`, `/owner`, `/school-dashboard`, `/auth/v1/`, `private-documents`, or `razorpay` endpoints.
6. **Privilege Escalation Prevention & Immutable Audit Trail**:
   - Self-registration strips `super_admin` and `admin_*` roles; `audit_logs` has no client `UPDATE` or `DELETE` policies.
