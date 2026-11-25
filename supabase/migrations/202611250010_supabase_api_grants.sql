-- ============================================================================
-- SHALOM CONNECTHUB INDIA — Phase 10: PostgREST Role Privileges (Protected by RLS)
-- PostgreSQL requires schema/table GRANTs alongside Row Level Security policies.
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Anonymous visitors: read-only table privilege (RLS further restricts to public rows only)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT INSERT ON public.search_logs TO anon;

-- Authenticated users: CRUD table privilege (RLS strictly isolates every table per user/org/role)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Service role (Edge Functions): full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Sequences & Functions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
