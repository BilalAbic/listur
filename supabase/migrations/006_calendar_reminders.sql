-- ============================================================
-- Migration 006: Calendar export + hatırlatıcı bildirimleri
-- Sprint 2: v1.3 "Etkinlik İlgisi" modülünün ikinci dikeyi
-- ============================================================

-- notif_type enum'a 'event_reminder' ekle
-- (Sprint 1'de favorites + rsvps + reminder flag'leri eklenmişti; şimdi
-- bildirim tipini ekliyoruz ki cron job notifications.type alanına yazabilsin.)
ALTER TYPE public.notif_type ADD VALUE IF NOT EXISTS 'event_reminder';
