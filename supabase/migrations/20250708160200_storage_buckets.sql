-- PropertyPilot PRD-002: Storage buckets

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('logos', 'logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('property-photos', 'property-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('generated-pdfs', 'generated-pdfs', false, 52428800, ARRAY['application/pdf']),
  ('voice-assets', 'voice-assets', false, 10485760, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg']),
  ('qr-codes', 'qr-codes', true, 2097152, ARRAY['image/png', 'image/svg+xml']),
  ('exports', 'exports', false, 104857600, ARRAY['application/json', 'text/csv', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Avatars: users manage their own
CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatars');

-- Logos: property owners manage via property id folder
CREATE POLICY "Owners upload logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND is_property_owner(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Owners manage logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'logos'
    AND is_property_owner(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Owners delete logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'logos'
    AND is_property_owner(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Public read logos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'logos');

-- Property photos
CREATE POLICY "Owners upload property photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'property-photos'
    AND is_property_owner(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Owners manage property photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'property-photos'
    AND is_property_owner(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Owners delete property photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'property-photos'
    AND is_property_owner(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Public read property photos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'property-photos');

-- Documents (private)
CREATE POLICY "Owners upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND is_property_owner(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Owners manage documents"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND is_property_owner(((storage.foldername(name))[1])::uuid)
  );

-- Generated PDFs
CREATE POLICY "Owners manage generated PDFs"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'generated-pdfs'
    AND is_property_owner(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Public read generated PDFs for active properties"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'generated-pdfs');

-- QR codes
CREATE POLICY "Owners manage QR codes"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'qr-codes'
    AND is_property_owner(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Public read QR codes"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'qr-codes');

-- Voice assets
CREATE POLICY "Owners manage voice assets"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'voice-assets'
    AND is_property_owner(((storage.foldername(name))[1])::uuid)
  );

-- Exports
CREATE POLICY "Owners manage exports"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'exports'
    AND is_property_owner(((storage.foldername(name))[1])::uuid)
  );
