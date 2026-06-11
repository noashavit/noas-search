-- Lock down searches table: only edge functions (service_role) should access it.
-- The client never queries this table directly; it's a server-side cache populated by edge functions.

DROP POLICY IF EXISTS "Anyone can insert searches" ON public.searches;
DROP POLICY IF EXISTS "Anyone can read searches" ON public.searches;

REVOKE ALL ON public.searches FROM anon, authenticated;
GRANT ALL ON public.searches TO service_role;

-- RLS stays enabled; with no policies, anon/authenticated have zero access.
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;