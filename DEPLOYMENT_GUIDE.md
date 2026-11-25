# DEPLOYMENT GUIDE — SHALOM CONNECTHUB INDIA

**Target Supabase Project**: `fkjiafpcbgqtnkdonrtb` (`https://fkjiafpcbgqtnkdonrtb.supabase.co`)  
**Target Monthly Operating Budget**: **₹2,500–₹4,000 / month**

---

## 1. Cost-Controlled Infrastructure Plan (₹2,500–₹4,000/mo Target)
| Layer | Recommended Service | Estimated Monthly Cost (INR) | Notes |
| :--- | :--- | :---: | :--- |
| **Database, Auth, Storage & Edge Functions** | Supabase Pro (or Free during initial validation) | ₹0 – ₹2,150 | Single source of truth PostgreSQL; auto-upgrade disabled |
| **Frontend & PWA Hosting** | Cloudflare Pages / Vercel Free or Hobby | ₹0 | Global CDN, automatic HTTPS, zero server idle cost |
| **Payments** | Razorpay Standard | Transaction % only (₹0 fixed) | Sandbox for dev/QA; Live keys only in Edge Secrets |
| **WhatsApp Official API** | Meta Cloud API (Utility/Service templates) | ₹300 – ₹800 | Governed by `daily_cap` & explicit user opt-in consent |
| **AI API (Gemini 2.5 Flash)** | Google AI Studio / Gemini API | ₹200 – ₹800 | Governed by `ai_settings.monthly_budget_cap_inr` (default ₹800) |
| **Domain & DNS (.in)** | Cloudflare Registrar / Namecheap | ~₹80 / mo amortized | SSL via Cloudflare |
| **Total Initial Run Rate** | | **₹580 – ₹3,830 / mo** | Within ₹2,500–₹4,000 target |

---

## 2. Step-by-Step Supabase Setup (`fkjiafpcbgqtnkdonrtb`)

### Step 1: Apply PostgreSQL Migrations (In Exact Order)
Run via Supabase CLI or Dashboard SQL Editor:
```powershell
npx.cmd supabase login
npx.cmd supabase link --project-ref fkjiafpcbgqtnkdonrtb
npx.cmd supabase db push
```
Migration files executed in order:
1. `202611250001_phase1_core_schema.sql`
2. `202611250002_phase1_rls_policies.sql`
3. `202611250003_phase1_india_seed.sql`
4. `202611250004_phase2_staff_connect.sql`
5. `202611250005_phase3_property_connect.sql`
6. `202611250006_phase4_school_connect.sql`
7. `202611250007_phase5_financial_engine.sql`
8. `202611250008_phase6_enquiries_and_automation.sql`
9. `202611250009_phase7_ai_module.sql`

### Step 2: Configure Server-Side Edge Function Secrets
Never place these in `.env` or `VITE_*` variables:
```powershell
npx.cmd supabase secrets set RAZORPAY_KEY_ID="rzp_test_..."
npx.cmd supabase secrets set RAZORPAY_KEY_SECRET="..."
npx.cmd supabase secrets set RAZORPAY_WEBHOOK_SECRET="..."
npx.cmd supabase secrets set WHATSAPP_PHONE_ID="..."
npx.cmd supabase secrets set WHATSAPP_API_TOKEN="..."
npx.cmd supabase secrets set GEMINI_API_KEY="..."
```

### Step 3: Deploy Edge Functions
```powershell
npx.cmd supabase functions deploy razorpay-create-order
npx.cmd supabase functions deploy razorpay-verify-payment
npx.cmd supabase functions deploy razorpay-webhook
npx.cmd supabase functions deploy automation-worker
npx.cmd supabase functions deploy ai-gateway
```

### Step 4: Bootstrap Initial Super Administrator
1. Register your primary admin email via `/register` in the deployed app.
2. In Supabase SQL Editor, promote that user's UUID once:
   ```sql
   INSERT INTO public.user_roles (user_id, role, is_active)
   VALUES ('<YOUR_USER_UUID>', 'super_admin', true)
   ON CONFLICT (user_id, role) DO UPDATE SET is_active = true;
   ```

---

## 3. Frontend Production Build & Hosting
Set environment variables in your hosting provider (Cloudflare Pages / Vercel / Netlify):
- `VITE_SUPABASE_URL=https://fkjiafpcbgqtnkdonrtb.supabase.co`
- `VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>`
- `VITE_APP_NAME=SHALOM CONNECTHUB INDIA`
- `VITE_ENABLE_LOCAL_SANDBOX=false`

Build command: `npm run build` · Output directory: `dist` · Configure SPA fallback rewrite (`/* -> /index.html`).

---

## 4. Pre-Launch Legal & Operational Checklist (India)
- [ ] Switch Razorpay from Sandbox (`rzp_test_*`) to Live (`rzp_live_*`) only after KYC & webhook verification.
- [ ] Verify GSTIN, supplier state code (`SUPPLIER_STATE_CODE` in `src/services/gstInvoice.ts`), and invoice series with a Chartered Accountant.
- [ ] Confirm Terms of Service, Privacy Policy (DPDPA), Refund Policy, and Grievance Officer contact (`grievance@shalomconnecthub.in`) are live and accurate.
- [ ] Obtain legal review before enabling any commercial property facilitation or recruitment placement commission rules.
