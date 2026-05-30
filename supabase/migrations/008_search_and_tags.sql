-- ============================================================
-- Migration 008: Full-text Search + Tags
-- Sprint 5: v1.3 Modül C "Akıllı Keşif" — birinci dikey
-- ============================================================

-- ─── Extension ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;

-- ─── Türkçe text search configuration ───────────────────────
-- 'simple' başlangıç — sadece lowercase. unaccent ekleyerek
-- Türkçe karakterleri (İ, Ş, Ç, Ğ, Ü, Ö) ASCII karşılığına dönüştürür.
-- "İstanbul Hackathon" / "istanbul hackathon" / "ISTANBUL" eşleşir.
CREATE TEXT SEARCH CONFIGURATION public.turkish_unaccent (COPY = pg_catalog.simple);

ALTER TEXT SEARCH CONFIGURATION public.turkish_unaccent
  ALTER MAPPING FOR hword, hword_part, word
  WITH public.unaccent, simple;

-- ─── events ek alanları ─────────────────────────────────────
ALTER TABLE public.events
  ADD COLUMN tags          text[] NOT NULL DEFAULT '{}',
  ADD COLUMN search_vector tsvector;

-- ─── search_vector trigger (GENERATED STORED kolon yerine) ──
-- NOT: GENERATED STORED IMMUTABLE function gerektirir. unaccent()
-- PostgreSQL'de STABLE olduğundan GENERATED kolonda kullanılamaz.
-- Bu yüzden BEFORE INSERT/UPDATE trigger ile populate ediyoruz.
CREATE OR REPLACE FUNCTION public.update_event_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('public.turkish_unaccent', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('public.turkish_unaccent', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('public.turkish_unaccent', array_to_string(coalesce(NEW.tags, '{}'), ' ')), 'C') ||
    setweight(to_tsvector('public.turkish_unaccent', coalesce(NEW.city, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_search_vector_update
  BEFORE INSERT OR UPDATE OF title, description, tags, city ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_search_vector();

-- Mevcut satırlar için search_vector'ü doldur
-- (title = title NO-OP gibi görünür ama trigger'ı tetikler)
UPDATE public.events SET title = title;

-- ─── Indeksler ──────────────────────────────────────────────
CREATE INDEX events_search_vector_idx ON public.events USING GIN (search_vector);
CREATE INDEX events_tags_idx           ON public.events USING GIN (tags);
