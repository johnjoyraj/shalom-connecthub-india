# EXISTING FEATURES INVENTORY — SHALOM CONNECTHUB INDIA

**Last Updated**: 2026-11-25  
**Scope**: `e:\MYWORKSPACE\SHALOM CONNECTHUB INDIA` + Sibling Workspace Reference Audit

---

## 1. Existing Features in `SHALOM CONNECTHUB INDIA`

| Area | Status | Notes |
| :--- | :--- | :--- |
| Project Directory & Phase 0 Docs | **COMPLETED** | Folder created; audit & roadmap documents initialized |
| Frontend Application (React/TS/Vite/Tailwind) | **NOT STARTED** | Pending Phase 1 (requires Node.js LTS installation) |
| Backend & Database (Supabase/PostgreSQL/RLS) | **NOT STARTED** | Pending Phase 1 |
| Module A: Staff Connect | **NOT STARTED** | Pending Phase 2 |
| Module B: Property Connect | **NOT STARTED** | Pending Phase 3 |
| Module C: School Connect | **NOT STARTED** | Pending Phase 4 |
| Subscription & Razorpay Payment Engine | **NOT STARTED** | Pending Phase 5 |
| Enquiry & Notification Automation | **NOT STARTED** | Pending Phase 6 |
| AI Automation Module | **NOT STARTED** | Pending Phase 7 |
| PWA & Mobile Optimisation | **NOT STARTED** | Pending Phase 8 |
| Automated Test Suite (Vitest / Playwright) | **NOT STARTED** | Pending Phase 1–9 incremental tests |

---

## 2. Sibling Workspace Projects Audited (Separate Products — Preserved Untouched)

These sibling projects live in `e:\MYWORKSPACE` and must **never** be modified or merged destructively into `SHALOM CONNECTHUB INDIA`:

| Sibling Folder | Domain | Stack | Reusable Reference Pattern for ConnectHub | Non-Reusable / Must Replace |
| :--- | :--- | :--- | :--- | :--- |
| `BILLBOOK-SAAS` | GST Billing & Inventory | HTML/JS, Firebase RTDB | Indian CGST/SGST vs IGST tax splitting & Rupees-in-words invoice logic | Firebase RTDB storage; client-side state |
| `WHATSAPP-AUTOMATION` | WhatsApp Broadcasts | Python Flask, Selenium, Meta Graph API v21.0 | `whatsapp_cloud_api.py` Graph API v21.0 structure & phone sanitization | Selenium automation; hardcoded fallback config |
| `school` | Multi-School ERP | HTML/JS, SQLite, Firebase RTDB, Flutter | Indian school plan structure, board/class concepts | Firebase RTDB; manual UTR UPI links |
| `SHALOM` | Shalom Kerala Stores POS | PWA, Android Java, Firebase RTDB | Storefront UI familiarity | Firebase RTDB; retail-only schema |
| `prayforindia` | National Prayer Portal | HTML/JS, Python, Firebase RTDB | English / Hindi / Malayalam trilingual structure | Firebase RTDB |
