-- ============================================================
-- Migration 005: Engagement (favorites + rsvps + event_views)
-- Sprint 1: v1.3 "Etkinlik İlgisi" modülü
-- ============================================================

-- ─── Enum: rsvp_status ──────────────────────────────────────
CREATE TYPE public.rsvp_status AS ENUM (
  'going',
  'interested',
  'not_going'
);

-- ─── events tablosuna denormalize sayaçlar ──────────────────
-- Sayaçlar trigger ile güncel tutulur; JOIN'siz hızlı okuma için.
ALTER TABLE public.events
  ADD COLUMN favorite_count int NOT NULL DEFAULT 0,
  ADD COLUMN rsvp_count     int NOT NULL DEFAULT 0,
  ADD COLUMN view_count     int NOT NULL DEFAULT 0;

-- Trending feed (Sprint 6) için sayaç-bazlı sıralama indeksi
CREATE INDEX idx_events_engagement_score
  ON public.events ((view_count + favorite_count * 3 + rsvp_count * 5) DESC)
  WHERE status = 'published';

-- ─── favorites ──────────────────────────────────────────────
CREATE TABLE public.favorites (
  user_id     uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  event_id    uuid NOT NULL REFERENCES public.events   ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

CREATE INDEX idx_favorites_event_id ON public.favorites (event_id);
CREATE INDEX idx_favorites_user_created ON public.favorites (user_id, created_at DESC);

-- ─── rsvps ──────────────────────────────────────────────────
CREATE TABLE public.rsvps (
  user_id              uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  event_id             uuid NOT NULL REFERENCES public.events   ON DELETE CASCADE,
  status               public.rsvp_status NOT NULL,
  reminder_24h_sent    boolean NOT NULL DEFAULT false,
  reminder_1h_sent     boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

CREATE INDEX idx_rsvps_event_id ON public.rsvps (event_id);
CREATE INDEX idx_rsvps_user_created ON public.rsvps (user_id, created_at DESC);
-- Hatırlatıcı cron'u için partial indeksler (Sprint 2)
CREATE INDEX idx_rsvps_pending_24h
  ON public.rsvps (event_id, user_id)
  WHERE reminder_24h_sent = false AND status IN ('going', 'interested');
CREATE INDEX idx_rsvps_pending_1h
  ON public.rsvps (event_id, user_id)
  WHERE reminder_1h_sent = false AND status IN ('going', 'interested');

-- ─── event_views ────────────────────────────────────────────
-- Sprint 1: tablo + RLS hazır; INSERT endpoint Sprint 3'te aktif kullanılır.
-- Anonim kullanıcı için viewer_ip, kayıtlı için viewer_id dolu olur.
-- Günlük unique constraint sayım manipülasyonunu önler.
CREATE TABLE public.event_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES public.events ON DELETE CASCADE,
  viewer_id   uuid REFERENCES public.profiles ON DELETE SET NULL,
  viewer_ip   text,
  viewed_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_views_event_id ON public.event_views (event_id);
CREATE INDEX idx_event_views_event_date ON public.event_views (event_id, viewed_at DESC);

-- Kayıtlı kullanıcı için gün başına 1 view (kayıtlı)
-- NOT: date_trunc IMMUTABLE değil → ::date cast IMMUTABLE
CREATE UNIQUE INDEX idx_event_views_unique_user_day
  ON public.event_views (event_id, viewer_id, ((viewed_at AT TIME ZONE 'UTC')::date))
  WHERE viewer_id IS NOT NULL;

-- Misafir için gün başına 1 view (IP + tarih)
CREATE UNIQUE INDEX idx_event_views_unique_ip_day
  ON public.event_views (event_id, viewer_ip, ((viewed_at AT TIME ZONE 'UTC')::date))
  WHERE viewer_id IS NULL AND viewer_ip IS NOT NULL;

-- ─── Trigger: updated_at otomatik güncelleme (rsvps) ────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rsvps_set_updated_at
  BEFORE UPDATE ON public.rsvps
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── Trigger: events.favorite_count senkron ─────────────────
CREATE OR REPLACE FUNCTION public.sync_event_favorite_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events
      SET favorite_count = favorite_count + 1
      WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.events
      SET favorite_count = GREATEST(favorite_count - 1, 0)
      WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER favorites_sync_count
  AFTER INSERT OR DELETE ON public.favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_event_favorite_count();

-- ─── Trigger: events.rsvp_count senkron ─────────────────────
-- Sadece 'going' ve 'interested' sayılır; 'not_going' sayaç dışıdır.
CREATE OR REPLACE FUNCTION public.sync_event_rsvp_count()
RETURNS trigger AS $$
DECLARE
  was_counted boolean;
  is_counted  boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IN ('going', 'interested') THEN
      UPDATE public.events
        SET rsvp_count = rsvp_count + 1
        WHERE id = NEW.event_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    was_counted := OLD.status IN ('going', 'interested');
    is_counted  := NEW.status IN ('going', 'interested');
    IF was_counted AND NOT is_counted THEN
      UPDATE public.events
        SET rsvp_count = GREATEST(rsvp_count - 1, 0)
        WHERE id = NEW.event_id;
    ELSIF NOT was_counted AND is_counted THEN
      UPDATE public.events
        SET rsvp_count = rsvp_count + 1
        WHERE id = NEW.event_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('going', 'interested') THEN
      UPDATE public.events
        SET rsvp_count = GREATEST(rsvp_count - 1, 0)
        WHERE id = OLD.event_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER rsvps_sync_count
  AFTER INSERT OR UPDATE OR DELETE ON public.rsvps
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_event_rsvp_count();

-- ─── Trigger: events.view_count senkron ─────────────────────
CREATE OR REPLACE FUNCTION public.sync_event_view_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events
      SET view_count = view_count + 1
      WHERE id = NEW.event_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER event_views_sync_count
  AFTER INSERT ON public.event_views
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_event_view_count();

-- ============================================================
-- RLS politikaları
-- ============================================================

ALTER TABLE public.favorites    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_views  ENABLE ROW LEVEL SECURITY;

-- ─── favorites ──────────────────────────────────────────────
-- Kullanıcı sadece kendi favorilerini görür, ekler, siler.
CREATE POLICY "favorites_select_self"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "favorites_insert_self"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_delete_self"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ─── rsvps ──────────────────────────────────────────────────
-- Aynı pattern: kullanıcı sadece kendi RSVP'sini görür/değiştirir.
CREATE POLICY "rsvps_select_self"
  ON public.rsvps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "rsvps_insert_self"
  ON public.rsvps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rsvps_update_self"
  ON public.rsvps FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rsvps_delete_self"
  ON public.rsvps FOR DELETE
  USING (auth.uid() = user_id);

-- ─── event_views ────────────────────────────────────────────
-- INSERT: herkese açık (anonim ziyaret de log'lanır).
-- SELECT: sadece etkinlik sahibi organizatör veya mod/admin.
CREATE POLICY "event_views_insert_public"
  ON public.event_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "event_views_select_owner_or_mod"
  ON public.event_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_views.event_id
        AND e.organizer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('moderator', 'admin')
    )
  );

-- DELETE/UPDATE: yok — view kayıtları immutable
