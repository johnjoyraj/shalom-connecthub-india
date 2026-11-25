-- ============================================================================
-- SHALOM CONNECTHUB INDIA — Phase 1: All-India Locations, Categories & Defaults
-- ============================================================================

-- 1. Country Root
INSERT INTO public.locations (country_code, level, parent_id, name, slug, code, state_code, is_active)
VALUES ('IN', 'COUNTRY', NULL, 'India', 'india', 'IN', NULL, true)
ON CONFLICT (slug) DO NOTHING;

-- 2. All 28 States and 8 Union Territories of India (36 total)
WITH india AS (SELECT id FROM public.locations WHERE slug = 'india' LIMIT 1)
INSERT INTO public.locations (country_code, level, parent_id, name, slug, code, state_code, is_active)
SELECT 'IN', 'STATE', india.id, s.name, s.slug, s.code, s.code, true
FROM india
CROSS JOIN (
  VALUES
    ('Andhra Pradesh', 'in-ap', 'AP'),
    ('Arunachal Pradesh', 'in-ar', 'AR'),
    ('Assam', 'in-as', 'AS'),
    ('Bihar', 'in-br', 'BR'),
    ('Chhattisgarh', 'in-cg', 'CG'),
    ('Goa', 'in-ga', 'GA'),
    ('Gujarat', 'in-gj', 'GJ'),
    ('Haryana', 'in-hr', 'HR'),
    ('Himachal Pradesh', 'in-hp', 'HP'),
    ('Jharkhand', 'in-jh', 'JH'),
    ('Karnataka', 'in-ka', 'KA'),
    ('Kerala', 'in-kl', 'KL'),
    ('Madhya Pradesh', 'in-mp', 'MP'),
    ('Maharashtra', 'in-mh', 'MH'),
    ('Manipur', 'in-mn', 'MN'),
    ('Meghalaya', 'in-ml', 'ML'),
    ('Mizoram', 'in-mz', 'MZ'),
    ('Nagaland', 'in-nl', 'NL'),
    ('Odisha', 'in-od', 'OD'),
    ('Punjab', 'in-pb', 'PB'),
    ('Rajasthan', 'in-rj', 'RJ'),
    ('Sikkim', 'in-sk', 'SK'),
    ('Tamil Nadu', 'in-tn', 'TN'),
    ('Telangana', 'in-ts', 'TS'),
    ('Tripura', 'in-tr', 'TR'),
    ('Uttar Pradesh', 'in-up', 'UP'),
    ('Uttarakhand', 'in-uk', 'UK'),
    ('West Bengal', 'in-wb', 'WB'),
    ('Andaman and Nicobar Islands', 'in-an', 'AN'),
    ('Chandigarh', 'in-ch', 'CH'),
    ('Dadra and Nagar Haveli and Daman and Diu', 'in-dn', 'DN'),
    ('Delhi (NCT)', 'in-dl', 'DL'),
    ('Jammu and Kashmir', 'in-jk', 'JK'),
    ('Ladakh', 'in-la', 'LA'),
    ('Lakshadweep', 'in-ld', 'LD'),
    ('Puducherry', 'in-py', 'PY')
) AS s(name, slug, code)
ON CONFLICT (slug) DO NOTHING;

-- 3. Representative Districts & Major Cities Across India (Admin can add/manage more)
INSERT INTO public.locations (country_code, level, parent_id, name, slug, state_code, pincode, latitude, longitude, is_active)
SELECT 'IN', d.level, p.id, d.name, d.slug, d.state_code, d.pincode, d.lat, d.lng, true
FROM (
  VALUES
    ('in-up', 'DISTRICT', 'Gorakhpur District', 'in-up-gorakhpur-dist', 'UP', NULL, 26.7606, 83.3732),
    ('in-up', 'DISTRICT', 'Lucknow District', 'in-up-lucknow-dist', 'UP', NULL, 26.8467, 80.9462),
    ('in-kl', 'DISTRICT', 'Ernakulam District', 'in-kl-ernakulam-dist', 'KL', NULL, 9.9816, 76.2999),
    ('in-kl', 'DISTRICT', 'Thiruvananthapuram District', 'in-kl-tvm-dist', 'KL', NULL, 8.5241, 76.9366),
    ('in-mh', 'DISTRICT', 'Mumbai Suburban', 'in-mh-mumbai-dist', 'MH', NULL, 19.0760, 72.8777),
    ('in-mh', 'DISTRICT', 'Pune District', 'in-mh-pune-dist', 'MH', NULL, 18.5204, 73.8567),
    ('in-ka', 'DISTRICT', 'Bengaluru Urban', 'in-ka-bengaluru-dist', 'KA', NULL, 12.9716, 77.5946),
    ('in-tn', 'DISTRICT', 'Chennai District', 'in-tn-chennai-dist', 'TN', NULL, 13.0827, 80.2707),
    ('in-ts', 'DISTRICT', 'Hyderabad District', 'in-ts-hyderabad-dist', 'TS', NULL, 17.3850, 78.4867),
    ('in-dl', 'DISTRICT', 'New Delhi District', 'in-dl-newdelhi-dist', 'DL', NULL, 28.6139, 77.2090),
    ('in-wb', 'DISTRICT', 'Kolkata District', 'in-wb-kolkata-dist', 'WB', NULL, 22.5726, 88.3639),
    ('in-gj', 'DISTRICT', 'Ahmedabad District', 'in-gj-ahmedabad-dist', 'GJ', NULL, 23.0225, 72.5714),
    ('in-rj', 'DISTRICT', 'Jaipur District', 'in-rj-jaipur-dist', 'RJ', NULL, 26.9124, 75.7873),
    ('in-as', 'DISTRICT', 'Kamrup Metropolitan', 'in-as-kamrup-dist', 'AS', NULL, 26.1445, 91.7362)
) AS d(parent_slug, level, name, slug, state_code, pincode, lat, lng)
JOIN public.locations p ON p.slug = d.parent_slug
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.locations (country_code, level, parent_id, name, slug, state_code, pincode, latitude, longitude, is_active)
SELECT 'IN', 'CITY', p.id, c.name, c.slug, c.state_code, c.pincode, c.lat, c.lng, true
FROM (
  VALUES
    ('in-up-gorakhpur-dist', 'Gorakhpur', 'in-up-gorakhpur', 'UP', '273001', 26.7606, 83.3732),
    ('in-up-lucknow-dist', 'Lucknow', 'in-up-lucknow', 'UP', '226001', 26.8467, 80.9462),
    ('in-kl-ernakulam-dist', 'Kochi', 'in-kl-kochi', 'KL', '682001', 9.9312, 76.2673),
    ('in-kl-tvm-dist', 'Thiruvananthapuram', 'in-kl-thiruvananthapuram', 'KL', '695001', 8.5241, 76.9366),
    ('in-mh-mumbai-dist', 'Mumbai', 'in-mh-mumbai', 'MH', '400001', 19.0760, 72.8777),
    ('in-mh-pune-dist', 'Pune', 'in-mh-pune', 'MH', '411001', 18.5204, 73.8567),
    ('in-ka-bengaluru-dist', 'Bengaluru', 'in-ka-bengaluru', 'KA', '560001', 12.9716, 77.5946),
    ('in-tn-chennai-dist', 'Chennai', 'in-tn-chennai', 'TN', '600001', 13.0827, 80.2707),
    ('in-ts-hyderabad-dist', 'Hyderabad', 'in-ts-hyderabad', 'TS', '500001', 17.3850, 78.4867),
    ('in-dl-newdelhi-dist', 'New Delhi', 'in-dl-new-delhi', 'DL', '110001', 28.6139, 77.2090),
    ('in-wb-kolkata-dist', 'Kolkata', 'in-wb-kolkata', 'WB', '700001', 22.5726, 88.3639),
    ('in-gj-ahmedabad-dist', 'Ahmedabad', 'in-gj-ahmedabad', 'GJ', '380001', 23.0225, 72.5714),
    ('in-rj-jaipur-dist', 'Jaipur', 'in-rj-jaipur', 'RJ', '302001', 26.9124, 75.7873),
    ('in-as-kamrup-dist', 'Guwahati', 'in-as-guwahati', 'AS', '781001', 26.1445, 91.7362)
) AS c(parent_slug, name, slug, state_code, pincode, lat, lng)
JOIN public.locations p ON p.slug = c.parent_slug
ON CONFLICT (slug) DO NOTHING;

-- 4. Initial Release Categories & Future Configurable Modules
INSERT INTO public.categories (module_key, name, slug, description, icon, sort_order, is_enabled, is_future_module)
VALUES
  ('staff', 'Staff Connect — Jobs & Talent', 'staff-connect', 'Full-time, part-time, temporary and contract jobs plus verified candidate profiles across India.', 'Briefcase', 10, true, false),
  ('property', 'Property Connect — Rentals, Sales & Land', 'property-connect', 'Houses, flats, commercial shops, offices, PGs/hostels, residential plots and agricultural land.', 'Building2', 20, true, false),
  ('school', 'School Connect — Institutions & Admissions', 'school-connect', 'Schools, colleges, preschools, tuition centres, coaching institutes, admissions and faculty hiring.', 'GraduationCap', 30, true, false),
  ('home_services', 'Home Services', 'home-services', 'Plumbing, electrical, carpentry, appliance repair and home maintenance.', 'Wrench', 40, false, true),
  ('business_directory', 'Business Directory', 'business-directory', 'Verified local and B2B businesses across India.', 'Store', 50, false, true),
  ('vehicle_services', 'Vehicle Services', 'vehicle-services', 'Auto service centres, spares, detailing and roadside assistance.', 'Car', 60, false, true),
  ('transport', 'Transport & Logistics', 'transport', 'Packers, movers, commercial freight and fleet services.', 'Truck', 70, false, true),
  ('construction', 'Construction & Contractors', 'construction', 'Civil contractors, architects, builders and building materials.', 'Hammer', 80, false, true),
  ('event_management', 'Event Management', 'event-management', 'Event planners, catering, decor, sound and venues.', 'CalendarCheck', 90, false, true),
  ('agriculture', 'Agriculture & Farm Services', 'agriculture', 'Agri-inputs, farm equipment, produce trading and advisory.', 'Sprout', 100, false, true),
  ('professional_services', 'Professional Services', 'professional-services', 'Chartered accountants, legal, tax, design and consulting.', 'Scale', 110, false, true),
  ('equipment_rentals', 'Equipment Rentals', 'equipment-rentals', 'Machinery, generators, cameras and commercial equipment hire.', 'Package', 120, false, true),
  ('local_services', 'Other Local Services', 'local-services', 'Configurable community and neighbourhood service providers.', 'Compass', 130, false, true)
ON CONFLICT (slug) DO NOTHING;

-- 5. Feature Flags (Admin-Toggled)
INSERT INTO public.feature_flags (flag_key, label, description, is_enabled, config)
VALUES
  ('module_staff_connect', 'Staff Connect Module', 'Enable job vacancies, candidate profiles, and applications', true, '{"phase": 2}'::jsonb),
  ('module_property_connect', 'Property Connect Module', 'Enable property rentals, sales, land, and visit requests', true, '{"phase": 3}'::jsonb),
  ('module_school_connect', 'School Connect Module', 'Enable schools, colleges, coaching, admissions, and faculty hiring', true, '{"phase": 4}'::jsonb),
  ('module_future_services', 'Future Service Modules', 'Master toggle for configurable future marketplace categories', false, '{"phase": "future"}'::jsonb),
  ('ai_features_enabled', 'AI Assistant & Matching', 'Master gate for server-side AI listing, translation, and moderation', false, '{"monthly_cap_inr": 800, "languages": ["en", "hi", "ml"]}'::jsonb),
  ('whatsapp_notifications_enabled', 'Official WhatsApp Cloud Notifications', 'Requires Meta Business Cloud API verification in Phase 6', false, '{"daily_cap": 500}'::jsonb),
  ('pwa_install_prompt', 'PWA Install Banner', 'Show install prompt on supported mobile/desktop browsers', true, '{"phase": 8}'::jsonb)
ON CONFLICT (flag_key) DO NOTHING;

-- 6. Platform Settings (Public Config & Budget Guardrails)
INSERT INTO public.platform_settings (key, value, category, description, is_public)
VALUES
  (
    'brand_identity',
    '{"name": "SHALOM CONNECTHUB INDIA", "tagline": "Everything Connected. Opportunities Everywhere.", "vision": "One platform connecting people, employment, properties, schools, businesses and professional services across India."}'::jsonb,
    'BRAND',
    'Primary platform identity and tagline',
    true
  ),
  (
    'pricing_tiers_default',
    '[
      {"code": "FREE", "name": "Free", "monthly_inr": 0, "active_listings_limit": 1, "highlight": false},
      {"code": "STARTER", "name": "Starter", "monthly_inr": 199, "active_listings_limit": 3, "highlight": false},
      {"code": "PROFESSIONAL", "name": "Professional", "monthly_inr": 499, "active_listings_limit": 10, "highlight": true},
      {"code": "BUSINESS", "name": "Business", "monthly_inr": 999, "active_listings_limit": 30, "highlight": false},
      {"code": "PREMIUM", "name": "Premium", "monthly_inr": 1999, "active_listings_limit": 100, "highlight": false}
    ]'::jsonb,
    'FINANCE',
    'Default configurable subscription tiers (full billing engine activates in Phase 5)',
    true
  ),
  (
    'grievance_officer',
    '{"name": "Grievance Officer — Shalom ConnectHub India", "email": "grievance@shalomconnecthub.in", "response_sla_hours": 48, "jurisdiction": "India (DPDPA & IT Rules)"}'::jsonb,
    'COMPLIANCE',
    'Statutory grievance contact for DPDPA and IT Act compliance',
    true
  ),
  (
    'infrastructure_budget_target',
    '{"min_monthly_inr": 2500, "max_monthly_inr": 4000, "alert_threshold_pct": 80, "auto_upgrade_disabled": true}'::jsonb,
    'OPERATIONS',
    'Monthly infrastructure spend target and admin alert threshold',
    false
  )
ON CONFLICT (key) DO NOTHING;
