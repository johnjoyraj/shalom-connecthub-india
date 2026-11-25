# SHALOM CONNECTHUB INDIA

> **"Everything Connected. Opportunities Everywhere."**  
> One platform connecting people, employment, properties, schools, businesses and professional services across India.

---

## Architecture Overview
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Router (mobile-first responsive UI)
- **Backend & Single Source of Truth**: Supabase PostgreSQL (`fkjiafpcbgqtnkdonrtb`), Supabase Auth, Supabase Storage, Row Level Security (RLS), Edge Functions
- **Payments (Phase 5)**: Razorpay (server-verified Orders, Checkout, Webhooks, GST Invoices, Refunds)
- **Notifications (Phase 6)**: Official WhatsApp Business Platform API, Email, FCM Push (consent-governed)
- **AI Module (Phase 7)**: Independent server-side AI service (listing assistant, EN/HI/ML translation, matching, moderation)

---

## Quick Start (Local Development)
1. Install dependencies:
   ```powershell
   npm.cmd install
   ```
2. Configure environment variables in `.env.local`:
   - `VITE_SUPABASE_URL=https://fkjiafpcbgqtnkdonrtb.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=<your-anon-key-from-supabase-project-settings>`
   *(While `VITE_SUPABASE_ANON_KEY` is blank, the app runs in local sandbox mode for UI and Vitest verification.)*
3. Apply Supabase SQL migrations (via Supabase SQL Editor or `npx.cmd supabase db push`):
   - `supabase/migrations/202611250001_phase1_core_schema.sql`
   - `supabase/migrations/202611250002_phase1_rls_policies.sql`
   - `supabase/migrations/202611250003_phase1_india_seed.sql`
4. Run dev server, build, and tests:
   ```powershell
   npm.cmd run dev
   npm.cmd run build
   npm.cmd test
   ```

---

## Documentation Index
- [MASTER_PROJECT_INSTRUCTIONS.md](./MASTER_PROJECT_INSTRUCTIONS.md)
- [PROJECT_STATUS.md](./PROJECT_STATUS.md)
- [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- [SECURITY_GUIDE.md](./SECURITY_GUIDE.md)
- [TESTING_REPORT.md](./TESTING_REPORT.md)
- [CHANGELOG.md](./CHANGELOG.md)
