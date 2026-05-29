-- ============================================================
-- Dev seed verisi — sadece geliştirme ortamında kullan
-- ============================================================

-- NOT: Bu seed çalıştırmadan önce en az 1 admin kullanıcı oluşturulmuş olmalı.
-- Supabase dashboard'dan auth.users tablosuna bak ve admin_id'yi güncelle.

-- Örnek etkinlikler (tümü published, yaklaşan tarihler)
INSERT INTO public.events (
  title, description, category, city, is_online,
  start_date, end_date, registration_url, source_url,
  organizer_id, status, slug, published_at
)
VALUES
(
  'İstanbul AI Meetup #12',
  'Türkiye''nin en büyük yapay zeka topluluğunun aylık buluşması. Bu ay: LLM fine-tuning teknikleri ve Türkçe NLP üzerine sunumlar.',
  'Yapay Zeka / ML',
  'İstanbul',
  false,
  now() + interval '7 days',
  now() + interval '7 days' + interval '3 hours',
  'https://example.com/register',
  'https://example.com/istanbul-ai-meetup',
  NULL,
  'published',
  'istanbul-ai-meetup-12',
  now()
),
(
  'Ankara Web3 Hackathon 2026',
  '48 saatlik hackathon. Blockchain teknolojileri üzerine proje geliştirin, 100.000 TL ödül havuzu için yarışın.',
  'Blockchain / Web3',
  'Ankara',
  false,
  now() + interval '14 days',
  now() + interval '16 days',
  'https://example.com/register-hackathon',
  'https://example.com/ankara-web3',
  NULL,
  'published',
  'ankara-web3-hackathon-2026',
  now()
),
(
  'Online React Native Workshop',
  'Expo ile cross-platform mobil uygulama geliştirme. Başlangıç ve orta düzey katılımcılar için 4 saatlik pratik workshop.',
  'Mobil Geliştirme',
  NULL,
  true,
  now() + interval '3 days',
  now() + interval '3 days' + interval '4 hours',
  'https://example.com/register-rn',
  'https://example.com/rn-workshop',
  NULL,
  'published',
  'online-react-native-workshop',
  now()
),
(
  'DevOps Days İzmir 2026',
  'CI/CD, Kubernetes, Platform Engineering konularında ulusal konferans. 20+ konuşmacı, 2 gün.',
  'Backend / DevOps',
  'İzmir',
  false,
  now() + interval '21 days',
  now() + interval '22 days',
  'https://example.com/devopsdays',
  'https://example.com/devopsdays-izmir',
  NULL,
  'published',
  'devops-days-izmir-2026',
  now()
),
(
  'Siber Güvenlik CTF Türkiye',
  'Tüm seviyelere açık Capture The Flag yarışması. Online format, 24 saat süren zorlayıcı görevler.',
  'Siber Güvenlik',
  NULL,
  true,
  now() + interval '10 days',
  now() + interval '11 days',
  'https://example.com/ctf',
  'https://example.com/ctf-turkey',
  NULL,
  'published',
  'siber-guvenlik-ctf-turkiye',
  now()
),
(
  'Startup Weekend Bursa',
  '54 saatte fikrinizi ürüne dönüştürün. Mentörler, yatırımcılar ve teknoloji meraklılarıyla buluşun.',
  'Girişimcilik / Startup',
  'Bursa',
  false,
  now() + interval '30 days',
  now() + interval '32 days',
  'https://example.com/startup-weekend',
  'https://example.com/startup-bursa',
  NULL,
  'published',
  'startup-weekend-bursa',
  now()
),
(
  'UX Research Türkiye Konferansı',
  'Kullanıcı araştırması, tasarım odaklı düşünme ve ürün tasarımı üzerine Türkiye''nin ilk odaklı konferansı.',
  'Tasarım / UX',
  'İstanbul',
  false,
  now() + interval '45 days',
  now() + interval '45 days' + interval '8 hours',
  'https://example.com/uxconf',
  'https://example.com/ux-turkey',
  NULL,
  'published',
  'ux-research-turkiye-konferansi',
  now()
),
(
  'Unity Game Jam Online',
  'Hafta sonu boyunca Unity ile oyun geliştirin. Tema açıklanacak, tüm seviyelere açık.',
  'Oyun Geliştirme',
  NULL,
  true,
  now() + interval '5 days',
  now() + interval '7 days',
  'https://example.com/game-jam',
  'https://example.com/unity-jam',
  NULL,
  'published',
  'unity-game-jam-online',
  now()
)
ON CONFLICT (slug) DO NOTHING;
