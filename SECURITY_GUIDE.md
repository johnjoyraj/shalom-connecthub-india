# SECURITY GUIDE — SHALOM CONNECTHUB INDIA

## 1. Core Security Principles Enforced in Phase 1
1. **Row Level Security (RLS) Everywhere**: Every user-accessible PostgreSQL table has `ENABLE ROW LEVEL SECURITY` enforced in `202611250002_phase1_rls_policies.sql`.
2. **Zero Client-Side Secret Exposure**:
   - Browser code only reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - `SUPABASE_SERVICE_ROLE_KEY`, Razorpay secret keys, WhatsApp permanent tokens, and AI API keys must reside exclusively in Supabase Edge Function secrets.
3. **Privilege Escalation Prevention**:
   - Self-registration (`registerUser`) and self-profile role updates (`updateMyProfile`) filter out `super_admin`, `admin_moderation`, `admin_finance`, and `admin_system`.
   - PostgreSQL RLS `user_roles` policies restrict `INSERT`/`UPDATE` to non-admin roles unless `has_role(auth.uid(), 'super_admin')` is true.
4. **Scoped Administrative Access**:
   - `admin_moderation` (moderation & users), `admin_finance` (billing/plans/refunds), `admin_system` (categories/locations/flags), and `super_admin` are separated both in UI guards and PostgreSQL RLS helpers.
5. **Immutable Audit Trail**:
   - `audit_logs` has read-only admin `SELECT` policy and no `UPDATE`/`DELETE` policies; writes happen via `SECURITY DEFINER` function `public.record_audit_log(...)`.
6. **Storage Bucket Isolation**:
   - `public-media`: public read, authenticated write restricted to user's own UID folder.
   - `private-documents`: private bucket; read restricted strictly to owning UID folder + moderation/super admins.
7. **Indian Compliance & Claim Boundaries**:
   - Mandatory Terms + Privacy DPDPA consent recorded on registration.
   - Verification records explicitly state that document review does not constitute legal title or statutory certification.
