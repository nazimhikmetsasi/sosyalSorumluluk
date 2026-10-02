-- Demo organisations and listings in Bursa, for trying the app end to end.
--
-- Run in the Supabase SQL editor whenever the list is empty. Safe to re-run: it replaces its
-- own listings and leaves everything else alone.
--
-- Listings expire at their pickup end time and are for the day they are created, so this
-- stamps them relative to the moment you run it: pickup starts spread over the next hours
-- and every window closes at 23:59. Run it on the day you want to test, before ~21:30.
-- The first listing opens in about 20 minutes, which is inside the 30 minute cancellation
-- cut-off, so you can see "İptal süresi doldu" without waiting.

insert into public.organisations (id, name, kind, status, type, avatar, cover, address, lat, lng, phone) values
  ('bursa_01', 'Setbaşı Fırını', 'business', 'active', 'Fırın & Unlu Mamüller',
   'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&auto=format&fit=crop&q=80',
   'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
   'Setbaşı Cad. No:12, Osmangazi / Bursa', 40.1853, 29.0627, '+90 224 222 1100'),
  ('bursa_02', 'Nilüfer Organik Manav', 'business', 'active', 'Manav & Doğal Ürünler',
   'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=150&auto=format&fit=crop&q=80',
   'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
   'Özlüce Mah. 1. Cad. No:7, Nilüfer / Bursa', 40.2128, 28.9358, '+90 224 244 3300'),
  ('bursa_03', 'Kent Meydanı Lokantası', 'business', 'active', 'Restoran & Sıcak Yemek',
   'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=80',
   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
   'Kent Meydanı, Osmangazi / Bursa', 40.1888, 29.0642, '+90 224 233 5566'),
  ('bursa_04', 'Bursa Dayanışma Aşevi', 'ngo', 'active', 'STK & Aşevi',
   'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=150&auto=format&fit=crop&q=80',
   'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&auto=format&fit=crop&q=80',
   'Yıldırım Bayezid Mah., Yıldırım / Bursa', 40.1945, 29.0500, '+90 224 311 7788')
on conflict (id) do nothing;

delete from public.listings where organisation_id like 'bursa\_%';

with clock as (
  select (now() at time zone 'Europe/Istanbul') as ist
),
slot as (
  -- HH:MM text for "now + offset", clamped so it never runs past 23:30.
  select
    to_char(least(ist + interval '20 minutes', date_trunc('day', ist) + interval '23 hours 30 minutes'), 'HH24:MI') as in_20m,
    to_char(least(ist + interval '90 minutes', date_trunc('day', ist) + interval '23 hours 30 minutes'), 'HH24:MI') as in_90m,
    to_char(least(ist + interval '3 hours',    date_trunc('day', ist) + interval '23 hours 30 minutes'), 'HH24:MI') as in_3h,
    to_char(least(ist + interval '4 hours',    date_trunc('day', ist) + interval '23 hours 30 minutes'), 'HH24:MI') as in_4h
  from clock
)
insert into public.listings
  (organisation_id, title, description, category, type, price_original, price_discounted,
   portions_total, portions_available, pickup_start_time, pickup_end_time, image, allergens,
   lat, lng, weight_kg, co2_reduction_kg)
select v.organisation_id, v.title, v.description, v.category, v.type, v.price_original, v.price_discounted,
       v.portions_total, v.portions_total, v.pickup_start, '23:59', v.image, v.allergens,
       v.lat, v.lng, v.weight_kg, v.co2_reduction_kg
from slot, lateral (values
  ('bursa_01', 'Taze Ekmek & Poğaça Kurtarma Paketi',
   'Bugün fırından çıkan ekmek, sade ve peynirli poğaça karışık sürpriz paket.',
   'Unlu Mamüller', 'discounted', 150, 45, 6, slot.in_20m,
   'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
   array['Gluten', 'Süt Ürünleri']::text[], 40.1853, 29.0627, 1.6, 4.0),
  ('bursa_01', 'Simit & Açma Sepeti',
   'Günün sonunda kalan taze simit ve açmalardan oluşan paket.',
   'Unlu Mamüller', 'discounted', 100, 30, 8, slot.in_3h,
   'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
   array['Gluten', 'Susam']::text[], 40.1853, 29.0627, 1.2, 3.0),
  ('bursa_02', 'Mevsimlik Sebze & Meyve Kutusu (3 kg)',
   'Şekli kusurlu ama taptaze elma, mandalina, havuç ve ıspanak. Ücretsiz.',
   'Meyve & Sebze', 'free', 120, 0, 5, slot.in_90m,
   'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&auto=format&fit=crop&q=80',
   array['Alerjen Yok']::text[], 40.2128, 28.9358, 3.0, 7.5),
  ('bursa_02', 'Organik Yeşillik Paketi',
   'Marul, roka, dereotu ve maydanozdan oluşan günlük yeşillik paketi.',
   'Meyve & Sebze', 'discounted', 80, 25, 6, slot.in_4h,
   'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
   array['Alerjen Yok']::text[], 40.2128, 28.9358, 1.5, 3.6),
  ('bursa_03', 'İskender & Pilav Kurtarma Menüsü',
   'Öğle servisinden kalan hijyenik kapalı kaplarda iskender ve pilav.',
   'Sıcak Yemek', 'discounted', 260, 85, 5, slot.in_90m,
   'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
   array['Gluten', 'Süt Ürünleri']::text[], 40.1888, 29.0642, 1.4, 3.8),
  ('bursa_03', 'Günün Çorbası & Ana Yemek (2 Kap)',
   'Mercimek çorbası ve sebzeli güveç, sıcak servis kaplarında.',
   'Sıcak Yemek', 'discounted', 200, 60, 6, slot.in_3h,
   'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80',
   array['Gluten']::text[], 40.1888, 29.0642, 1.2, 3.2),
  ('bursa_04', 'Toplu Yemek Bağışı (Ücretsiz)',
   'Aşevi mutfağında dağıtılmak üzere hazırlanan sıcak yemek porsiyonları.',
   'Sıcak Yemek', 'free', 300, 0, 20, slot.in_90m,
   'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80',
   array['Alerjen Yok']::text[], 40.1945, 29.0500, 8.0, 20.0)
) as v(organisation_id, title, description, category, type, price_original, price_discounted,
       portions_total, pickup_start, image, allergens, lat, lng, weight_kg, co2_reduction_kg);

select public.recompute_organisation_trust(id) from public.organisations where id like 'bursa\_%';
