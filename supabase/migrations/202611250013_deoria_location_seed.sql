-- ============================================================================
-- SHALOM CONNECTHUB INDIA — Phase 10+: Deoria & Bhatni (UP) Location Seed
-- ============================================================================

WITH up AS (SELECT id FROM public.locations WHERE slug = 'in-up' LIMIT 1)
INSERT INTO public.locations (country_code, level, parent_id, name, slug, state_code, is_active)
SELECT 'IN', 'DISTRICT', up.id, 'Deoria District', 'in-up-deoria-dist', 'UP', true
FROM up
ON CONFLICT (slug) DO NOTHING;

WITH dist AS (SELECT id FROM public.locations WHERE slug = 'in-up-deoria-dist' LIMIT 1)
INSERT INTO public.locations (country_code, level, parent_id, name, slug, state_code, pincode, is_active)
SELECT 'IN', 'CITY', dist.id, c.name, c.slug, 'UP', c.pincode, true
FROM dist
CROSS JOIN (
  VALUES
    ('Deoria', 'in-up-deoria', '274001'),
    ('Bhatni (Deoria)', 'in-up-bhatni-deoria', '274701')
) AS c(name, slug, pincode)
ON CONFLICT (slug) DO NOTHING;
