# MASTER PROJECT INSTRUCTIONS — SHALOM CONNECTHUB INDIA

> **Vision**: "One platform connecting people, employment, properties, schools, businesses and professional services across India."  
> **Tagline**: "Everything Connected. Opportunities Everywhere."  
> **Project Folder**: `e:\MYWORKSPACE\SHALOM CONNECTHUB INDIA`

---

## 1. Role & Mandate
Build and maintain **SHALOM CONNECTHUB INDIA** as a complete, production-ready, modular, all-India commercial SaaS service marketplace supporting:
- Multiple service categories (`Staff Connect`, `Property Connect`, `School Connect`, plus configurable future modules)
- Multiple user types & organisations with unified authentication and RBAC
- Multiple subscriptions, automated service charges, Razorpay payments, and GST-compliant invoices
- Lead and enquiry management with automated notifications (WhatsApp Business Platform, Email, Push)
- AI-assisted listing, translation (English/Hindi/Malayalam), matching, moderation, and customer assistance
- Administrator-controlled business rules, audit logging, and future expansion without rebuilding

---

## 2. Preservation & Audit-First Rules
1. Never assume the project is empty; inspect the workspace, code, schemas, auth, git history, and deployment config first.
2. Maintain required pre-development and ongoing documentation:
   - `PROJECT_AUDIT.md`, `EXISTING_FEATURES.md`, `DATABASE_AUDIT.md`, `DEVELOPMENT_ROADMAP.md`, `PROJECT_STATUS.md`
   - `README.md`, `MASTER_PROJECT_INSTRUCTIONS.md`, `DATABASE_SCHEMA.md`, `API_DOCUMENTATION.md`, `DEPLOYMENT_GUIDE.md`, `SECURITY_GUIDE.md`, `TESTING_REPORT.md`, `CHANGELOG.md`
3. Preserve working modules, never reset production data, never delete migrations, and update `PROJECT_STATUS.md` after every session.

---

## 3. Target Technology Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Accessible Responsive UI, Progressive Web App (PWA)
- **Backend & Database**: Supabase (PostgreSQL primary single source of truth — do NOT duplicate core business records in Firebase), Supabase Auth, Supabase Storage, Row Level Security (RLS), Supabase Edge Functions
- **Integrations**: Razorpay (Indian payments & webhooks), Official WhatsApp Business Platform API, Email service, Firebase Cloud Messaging (if push requires it), Server-side AI APIs, GitHub

---

## 4. Core & Initial Release Modules
- **Module A — Staff Connect**: Employers, candidates, profiles, education, experience, skills, CV uploads, job vacancies (full-time/part-time/temporary/contract), filters, applications, shortlisting, recruitment enquiries, job ad subscriptions.
- **Module B — Property Connect**: Dynamic forms by property type/purpose (rentals, apartments, flats, commercial, shops, offices, hostels/PG, plots, agricultural land, independent houses, resale, lease), privacy-controlled addresses, owner/agent dashboards, buyer/tenant enquiries, visit requests, expiry, featured ads, reporting, document review (never claim legal title verification from uploaded docs alone).
- **Module C — School Connect**: Schools, colleges, preschools, tuition centres, coaching institutions; directory, profiles, gallery, facilities, board/affiliation, classes, admission enquiries, teaching/non-teaching vacancies, subscriptions, enquiry tracking.
- **Future Modules (Config-driven in Admin)**: Home services, business directory, vehicle services, transport, construction, event management, agriculture, professional services, equipment rentals, other local services.

---

## 5. Central User, Organisation, Location, Search, Enquiry, Revenue & AI Engines
- **Unified Auth & Orgs**: Single login supporting multi-role & multi-organisation memberships, OTP verification, profile verification, suspension, recovery, deletion requests.
- **All-India Location System**: India → States/UTs → Districts → Cities/Towns → PIN codes → Locality/Neighbourhood; admin-managed; proximity/hierarchy search.
- **Shared Search & Matching Engine**: Indexed, paginated server-side search with category filters, suggestions, saved searches, duplicate detection.
- **Common Enquiry Engine**: Lifecycle `NEW → VIEWED → CONTACTED → ACCEPTED → REJECTED → COMPLETED → CANCELLED → CLOSED` with validation, notifications, communication consent, and response tracking.
- **Subscription & Revenue Engine**: Configurable plans (`FREE ₹0/1`, `STARTER ₹199/3`, `PROFESSIONAL ₹499/10`, `BUSINESS ₹999/30`, `PREMIUM ₹1,999/100`), monthly/annual, credits, featured listings, service charges, commission rules; Razorpay checkout + backend signature & webhook verification + idempotency + invoices + refunds + expiry reminders (7d, 3d, 1d, 0d).
- **Automation & Notifications**: Scheduled backend jobs with retry/failure logging and deduplication; WhatsApp Business Platform API, Email, Push; consent and cost limits.
- **AI Module**: Listing assistant, language detection & translation (EN/HI/ML keeping original text), candidate matching, property matching, moderation flagging, customer assistant; usage tracking & spending caps; no legal/qualification guarantees.
- **Super Admin Control Centre**: Users, organisations, listings, categories, locations, finance, notifications, platform settings, feature flags, audit logs, role-scoped admin permissions (moderation, finance, system).
- **PWA, Cost & Indian Legal Compliance**: Target infra ₹2,500–₹4,000/month; DPDPA, IT Act, Consumer Protection e-commerce rules, GST, RERA/employment compliance disclaimers, consent records, grievance contact, account deletion, safe PWA caching (never cache private/payment/document pages).

---

## 6. Phased Delivery Sequence (Strict Order)
- **Phase 0**: Existing project audit and preservation *(Current)*
- **Phase 1**: Core architecture, database, authentication, profiles, and admin dashboard
- **Phase 2**: Staff Connect
- **Phase 3**: Property Connect
- **Phase 4**: School Connect
- **Phase 5**: Subscription and payment engine
- **Phase 6**: Enquiry and notification automation
- **Phase 7**: AI features
- **Phase 8**: PWA and mobile optimisation
- **Phase 9**: Security and performance testing
- **Phase 10**: Production deployment and documentation
