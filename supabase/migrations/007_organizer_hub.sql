-- ============================================================
-- Migration 007: Organizer Hub
-- Sprint 3: v1.3 Modül B — Organizatör profili + takip + bildirim
-- ============================================================

-- ─── profiles ek alanları ───────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN handle           text,
  ADD COLUMN bio              text,
  ADD COLUMN website          text,
  ADD COLUMN twitter          text,
  ADD COLUMN github           text,
  ADD COLUMN is_organizer     boolean NOT NULL DEFAULT false,
  ADD COLUMN verified_at      timestamptz,
  ADD COLUMN follower_count   int NOT NULL DEFAULT 0;

-- handle UNIQUE — sadece NULL olmayan satırlar arasında.
-- Mevcut tüm satırlar handle NULL ile başlar; Sprint 4 doğrulamasında set edilecek.
CREATE UNIQUE INDEX idx_profiles_handle
  ON public.profiles (handle)
  WHERE handle IS NOT NULL;

-- Organizatör listeleme/filtre için
CREATE INDEX idx_profiles_is_organizer
  ON public.profiles (is_organizer)
  WHERE is_organizer = true;

-- ─── organizer_follows ──────────────────────────────────────
-- A takipçi → B organizatör. PK her ikisini de içerir; aynı takip iki kez insertlenemez.
CREATE TABLE public.organizer_follows (
  follower_id   uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  organizer_id  uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, organizer_id),
  CHECK (follower_id <> organizer_id) -- kendini takip edemez
);

CREATE INDEX idx_organizer_follows_organizer ON public.organizer_follows (organizer_id);
CREATE INDEX idx_organizer_follows_follower ON public.organizer_follows (follower_id);

-- ─── organizer_applications ─────────────────────────────────
-- Sprint 4 doğrulama akışı için şema hazır; INSERT şu an admin'e açık değil
-- ama tablo + RLS şimdi tanımlanır ki Sprint 4'te sadece UI eklensin.
CREATE TABLE public.organizer_applications (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  requested_handle    text NOT NULL,
  bio                 text,
  website             text,
  twitter             text,
  github              text,
  reason              text,
  status              public.report_status NOT NULL DEFAULT 'open',
  reviewed_by         uuid REFERENCES public.profiles ON DELETE SET NULL,
  reviewed_at         timestamptz,
  rejection_note      text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Aynı kullanıcının açık (open) bir başvurusu olabilir, çözülmüş çoklu kayıt OK
CREATE UNIQUE INDEX idx_organizer_apps_one_open_per_user
  ON public.organizer_applications (user_id)
  WHERE status = 'open';

CREATE INDEX idx_organizer_apps_status ON public.organizer_applications (status);
CREATE INDEX idx_organizer_apps_created ON public.organizer_applications (created_at DESC);

-- ─── notif_type ek değerler ─────────────────────────────────
ALTER TYPE public.notif_type ADD VALUE IF NOT EXISTS 'organizer_new_event';
ALTER TYPE public.notif_type ADD VALUE IF NOT EXISTS 'organizer_verified';

-- ─── mod_action enum ek değer ───────────────────────────────
-- Sprint 4 verification akışında moderation_logs'a action='verified' yazılacak
ALTER TYPE public.mod_action ADD VALUE IF NOT EXISTS 'verified';

-- ─── follower_count senkron trigger ─────────────────────────
CREATE OR REPLACE FUNCTION public.sync_profile_follower_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
      SET follower_count = follower_count + 1
      WHERE id = NEW.organizer_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
      SET follower_count = GREATEST(follower_count - 1, 0)
      WHERE id = OLD.organizer_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER organizer_follows_sync_count
  AFTER INSERT OR DELETE ON public.organizer_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_follower_count();

-- ============================================================
-- RLS politikaları
-- ============================================================

ALTER TABLE public.organizer_follows       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_applications  ENABLE ROW LEVEL SECURITY;

-- ─── organizer_follows ──────────────────────────────────────
-- SELECT public — herkes takip ilişkilerini görebilir (follower_count zaten public)
CREATE POLICY "organizer_follows_select_public"
  ON public.organizer_follows FOR SELECT
  USING (true);

CREATE POLICY "organizer_follows_insert_self"
  ON public.organizer_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "organizer_follows_delete_self"
  ON public.organizer_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ─── organizer_applications ─────────────────────────────────
-- INSERT: sadece kendi başvurusu
CREATE POLICY "organizer_apps_insert_self"
  ON public.organizer_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- SELECT: kendi başvurusunu veya admin tümünü görür
CREATE POLICY "organizer_apps_select_self_or_admin"
  ON public.organizer_applications FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- UPDATE: sadece admin (Sprint 4 onay akışı)
CREATE POLICY "organizer_apps_update_admin"
  ON public.organizer_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE: yok (audit trail bütünlüğü için)
