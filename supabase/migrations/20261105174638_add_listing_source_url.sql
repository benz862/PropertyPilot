ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS listing_source_url TEXT;

COMMENT ON COLUMN public.properties.listing_source_url IS
  'Private agent-supplied reference URL for the listing; never treated as permission to scrape or republish third-party content.';
