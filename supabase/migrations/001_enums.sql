-- ============================================================
-- Migration 001: ENUM tipleri
-- ============================================================

CREATE TYPE public.user_role AS ENUM (
  'user',
  'verified_user',
  'moderator',
  'admin'
);

CREATE TYPE public.event_status AS ENUM (
  'pending',
  'published',
  'rejected',
  'removed'
);

CREATE TYPE public.notif_type AS ENUM (
  'new_event',
  'submission_approved',
  'submission_rejected',
  'report_resolved'
);

CREATE TYPE public.parse_source_type AS ENUM (
  'og',
  'gpt4o',
  'manual'
);

CREATE TYPE public.report_reason AS ENUM (
  'misleading',
  'spam',
  'irrelevant',
  'inappropriate',
  'other'
);

CREATE TYPE public.report_status AS ENUM (
  'open',
  'resolved'
);

CREATE TYPE public.mod_action AS ENUM (
  'approved',
  'rejected',
  'removed',
  'edited'
);
