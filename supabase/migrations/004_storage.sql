-- ============================================================
-- Migration 004: Supabase Storage — event-covers bucket
-- ============================================================

-- event-covers bucket oluştur (public okuma)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-covers',
  'event-covers',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public okuma (herkes)
CREATE POLICY "event_covers_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-covers');

-- Authenticated kullanıcı yükleyebilir
CREATE POLICY "event_covers_auth_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event-covers'
    AND auth.role() = 'authenticated'
  );

-- Service role güncelleme/silme (onay akışı için)
-- Service role RLS'i atlar — politika gerekmez

-- Dosya yolu formatı: event-covers/{event-id}/cover.{ext}
-- Örnek: event-covers/550e8400-e29b-41d4-a716-446655440000/cover.webp
