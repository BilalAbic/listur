-- ============================================================
-- Migration 003: Row Level Security (RLS) politikaları
-- ============================================================

-- Her tabloda RLS'i etkinleştir
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- ─── profiles ───────────────────────────────────────────────
-- Herkes profilleri okuyabilir
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (true);

-- Kullanıcı sadece kendi profilini oluşturabilir
CREATE POLICY "profiles_insert_self"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Kullanıcı sadece kendi profilini güncelleyebilir
CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ─── events ─────────────────────────────────────────────────
-- Herkese açık: yayındaki etkinlikleri okuma
CREATE POLICY "events_select_published"
  ON public.events FOR SELECT
  USING (
    status = 'published'
    OR auth.uid() = organizer_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('moderator', 'admin')
    )
  );

-- Giriş yapmış kullanıcılar etkinlik ekleyebilir
CREATE POLICY "events_insert_authenticated"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Moderatör ve admin güncelleyebilir; gönderici pending'de düzenleyebilir
CREATE POLICY "events_update_mod_admin_or_owner"
  ON public.events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('moderator', 'admin')
    )
    OR (auth.uid() = organizer_id AND status = 'pending')
  );

-- Sadece admin silebilir (soft delete tercih edilir, yine de kural ekle)
CREATE POLICY "events_delete_admin"
  ON public.events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- ─── notifications ──────────────────────────────────────────
-- Kullanıcı sadece kendi bildirimlerini okuyabilir
CREATE POLICY "notifications_select_self"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Kullanıcı sadece kendi bildirimini güncelleyebilir (okundu işareti)
CREATE POLICY "notifications_update_self"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- INSERT: sadece service_role (API route'lardan)
-- Service role, RLS'i atlar — politika eklemeye gerek yok

-- ─── submissions ────────────────────────────────────────────
-- Giriş yapmış kullanıcı kendi gönderimleri + mod/admin tümünü görebilir
CREATE POLICY "submissions_select"
  ON public.submissions FOR SELECT
  USING (
    auth.uid() = submitted_by
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('moderator', 'admin')
    )
  );

-- Giriş yapmış kullanıcılar ekleme yapabilir
CREATE POLICY "submissions_insert_authenticated"
  ON public.submissions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = submitted_by);

-- ─── reports ────────────────────────────────────────────────
-- Herkes rapor ekleyebilir (misafir dahil)
CREATE POLICY "reports_insert_public"
  ON public.reports FOR INSERT
  WITH CHECK (true);

-- Sadece mod ve admin raporları okuyabilir
CREATE POLICY "reports_select_mod_admin"
  ON public.reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('moderator', 'admin')
    )
  );

-- Sadece mod ve admin raporları güncelleyebilir (çözümleme)
CREATE POLICY "reports_update_mod_admin"
  ON public.reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('moderator', 'admin')
    )
  );

-- DELETE: hiç kimse rapor silemez
-- (politika yok = service_role hariç kimse silemez)

-- ─── moderation_logs ────────────────────────────────────────
-- Sadece mod ve admin logları okuyabilir
CREATE POLICY "moderation_logs_select_mod_admin"
  ON public.moderation_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('moderator', 'admin')
    )
  );

-- INSERT: sadece service_role (API route'lardan) — politika yok, service_role atlar
-- UPDATE: yok — loglar immutable
-- DELETE: KESİNLİKLE YOK — audit trail bütünlüğü için
