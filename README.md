# SHALOM CONNECTHUB INDIA

> **"Everything Connected. Opportunities Everywhere."**  
> One platform connecting people, employment, properties, schools, businesses and professional services across India.

---

## Implemented Modules (Phases 0–10)
- **Core Platform & Admin Control Centre**: Unified auth, multi-role/multi-org RBAC, All-India 36 States/UTs + District/City/PIN location taxonomy, configurable future modules, DPDPA consent records, and immutable audit logs.
- **Module A — Staff Connect**: Job vacancies (full-time, part-time, temporary, contract), candidate profiles/education/experience, private CV uploads, application tracking, shortlisting, and recruitment enquiries.
- **Module B — Property Connect**: Dynamic forms per property type & purpose (houses, apartments, shops, offices, hostels/PGs, plots, agricultural land), address privacy controls, owner/authorised-agent isolation, visit requests, reporting, and non-legal-title disclaimers.
- **Module C — School Connect**: Schools, colleges, preschools, tuition centres & coaching institutions, classes, facilities, admission enquiries, teaching/non-teaching recruitment, and cross-school RLS isolation.
- **Subscription, Charges & Razorpay Engine**: Admin-configurable plans, GST tax invoices (CGST/SGST vs. IGST + Rupees in Words), Razorpay order/signature/webhook Edge Functions, idempotency, refunds, and expiry reminders (`7D`, `3D`, `1D`, `0D`).
- **Enquiry & Notification Automation**: Common enquiry lifecycle, 2-way messaging, consent-checked Email / Official WhatsApp Cloud API / Push notifications, rate caps, and retry/failure job queue.
- **Independent AI Module**: Listing assistant, EN/HI/ML language detection & translation (preserving original text), candidate/property matching, moderation flagging, customer assistant, and monthly INR spend caps.
- **PWA & Security**: Installable manifest, offline fallback, safe service worker excluding private/payment/document routes, vendor chunk splitting, 45 Vitest unit/security tests, and 3 Playwright browser E2E tests.

---

## Quick Start
```powershell
npm.cmd install
npm.cmd run dev        # Or double-click START_CONNECTHUB_DEV.bat
npm.cmd run typecheck
npm.cmd run build
npm.cmd test           # Vitest (45 tests)
npm.cmd run test:e2e   # Playwright E2E (3 tests)
```
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) to connect live Supabase project `fkjiafpcbgqtnkdonrtb`.

---

## Complete Documentation Suite
- [MASTER_PROJECT_INSTRUCTIONS.md](./MASTER_PROJECT_INSTRUCTIONS.md)
- [PROJECT_AUDIT.md](./PROJECT_AUDIT.md)
- [EXISTING_FEATURES.md](./EXISTING_FEATURES.md)
- [DATABASE_AUDIT.md](./DATABASE_AUDIT.md)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [SECURITY_GUIDE.md](./SECURITY_GUIDE.md)
- [TESTING_REPORT.md](./TESTING_REPORT.md)
- [PROJECT_STATUS.md](./PROJECT_STATUS.md)
- [CHANGELOG.md](./CHANGELOG.md)
