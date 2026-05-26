-- ============================================================
-- Migration 002: Tablolar ve trigger'lar
-- ============================================================

-- ─── profiles ───────────────────────────────────────────────
CREATE TABLE public.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name            text NOT NULL DEFAULT '',
  email           text NOT NULL DEFAULT '',
  role            public.user_role NOT NULL DEFAULT 'user',
  interests       text[] NOT NULL DEFAULT '{}',
  notify_email    boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Yeni auth kullanıcısı → otomatik profile satırı
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─── events ─────────────────────────────────────────────────
CREATE TABLE public.events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text,
  cover_image     text,
  cover_image_og  text,
  category        text NOT NULL,
  city            text,
  is_online       boolean NOT NULL DEFAULT false,
  venue_name      text,
  start_date      timestamptz NOT NULL,
  end_date        timestamptz,
  registration_url text,
  source_url      text NOT NULL,
  organizer_id    uuid REFERENCES public.profiles ON DELETE SET NULL,
  status          public.event_status NOT NULL DEFAULT 'pending',
  rejection_note  text,
  slug            text UNIQUE NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  published_at    timestamptz,
  removed_at      timestamptz
);

-- Hızlı sorgular için indeksler
CREATE INDEX idx_events_status ON public.events (status);
CREATE INDEX idx_events_start_date ON public.events (start_date);
CREATE INDEX idx_events_category ON public.events (category);
CREATE INDEX idx_events_slug ON public.events (slug);
CREATE INDEX idx_events_organizer_id ON public.events (organizer_id);

-- ─── notifications ──────────────────────────────────────────
CREATE TABLE public.notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  event_id        uuid REFERENCES public.events ON DELETE CASCADE,
  type            public.notif_type NOT NULL,
  read_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX idx_notifications_read_at ON public.notifications (read_at) WHERE read_at IS NULL;

-- ─── submissions ────────────────────────────────────────────
CREATE TABLE public.submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES public.events ON DELETE CASCADE,
  submitted_by    uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  raw_url         text NOT NULL,
  parse_source    public.parse_source_type NOT NULL,
  submitted_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_submissions_event_id ON public.submissions (event_id);
CREATE INDEX idx_submissions_submitted_by ON public.submissions (submitted_by);

-- ─── reports ────────────────────────────────────────────────
CREATE TABLE public.reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES public.events ON DELETE CASCADE,
  reported_by     uuid REFERENCES public.profiles ON DELETE SET NULL,
  reporter_ip     text,
  reason          public.report_reason NOT NULL,
  description     text,
  status          public.report_status NOT NULL DEFAULT 'open',
  resolved_by     uuid REFERENCES public.profiles ON DELETE SET NULL,
  resolved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Aynı kullanıcı aynı etkinliği iki kez raporlayamaz
CREATE UNIQUE INDEX idx_reports_unique_user
  ON public.reports (event_id, reported_by)
  WHERE reported_by IS NOT NULL;

-- Aynı IP aynı etkinliği iki kez raporlayamaz (misafir)
CREATE UNIQUE INDEX idx_reports_unique_ip
  ON public.reports (event_id, reporter_ip)
  WHERE reporter_ip IS NOT NULL AND reported_by IS NULL;

CREATE INDEX idx_reports_status ON public.reports (status);
CREATE INDEX idx_reports_event_id ON public.reports (event_id);

-- ─── moderation_logs ────────────────────────────────────────
-- NOT: Bu tablo audit trail'dir. RLS'te DELETE izni VERİLMEYECEK.
CREATE TABLE public.moderation_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id    uuid NOT NULL REFERENCES public.profiles ON DELETE RESTRICT,
  event_id        uuid NOT NULL REFERENCES public.events ON DELETE RESTRICT,
  action          public.mod_action NOT NULL,
  changes         jsonb,
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_moderation_logs_moderator ON public.moderation_logs (moderator_id);
CREATE INDEX idx_moderation_logs_event ON public.moderation_logs (event_id);
CREATE INDEX idx_moderation_logs_created_at ON public.moderation_logs (created_at DESC);
