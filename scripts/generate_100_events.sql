-- 100 adet rastgele event ve duyuru oluştur
-- 50 event + 50 announcement

INSERT INTO events (title, description, date, end_date, city, location, type, category, is_active, attendee_count)
SELECT 
    'a' as title,
    'a' as description,
    NOW() + (random() * interval '30 days') as date,
    NOW() + (random() * interval '30 days') + interval '2 hours' as end_date,
    CASE floor(random() * 5)::int
        WHEN 0 THEN 'İstanbul'
        WHEN 1 THEN 'Ankara'
        WHEN 2 THEN 'İzmir'
        WHEN 3 THEN 'Bursa'
        ELSE 'Antalya'
    END as city,
    'a' as location,
    CASE WHEN i % 2 = 0 THEN 'event' ELSE 'announcement' END as type,
    CASE floor(random() * 4)::int
        WHEN 0 THEN 'Seminer'
        WHEN 1 THEN 'Konferans'
        WHEN 2 THEN 'Workshop'
        ELSE 'Duyuru'
    END as category,
    true as is_active,
    floor(random() * 100)::int as attendee_count
FROM generate_series(1, 100) as i;
