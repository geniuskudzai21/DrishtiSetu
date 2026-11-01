INSERT INTO settlements (id, name, district, location, population, vulnerability_index, risk_score)
VALUES
    (1, 'Dera Baba Nanak', 'Gurdaspur', ST_SetSRID(ST_MakePoint(75.0236, 32.0336), 4326)::geography, 6200, 78, 88),
    (2, 'Ramdas', 'Amritsar', ST_SetSRID(ST_MakePoint(74.9266, 31.9776), 4326)::geography, 9800, 70, 81),
    (3, 'Ajnala', 'Amritsar', ST_SetSRID(ST_MakePoint(74.7646, 31.8415), 4326)::geography, 15400, 64, 67),
    (4, 'Gatti Rajoke', 'Ferozepur', ST_SetSRID(ST_MakePoint(74.5970, 30.9230), 4326)::geography, 3100, 82, 90),
    (5, 'Mamdot', 'Ferozepur', ST_SetSRID(ST_MakePoint(74.4400, 30.8800), 4326)::geography, 7400, 66, 74),
    (6, 'Fatuhiwala', 'Ferozepur', ST_SetSRID(ST_MakePoint(74.5200, 30.9500), 4326)::geography, 2200, 48, 41)
ON CONFLICT (name, district) DO UPDATE SET
    location = EXCLUDED.location,
    population = EXCLUDED.population,
    vulnerability_index = EXCLUDED.vulnerability_index,
    risk_score = EXCLUDED.risk_score,
    updated_at = now();

INSERT INTO hazard_factors (settlement_id, factor_key, label, raw_value, risk_score)
SELECT s.id, data.factor_key, data.label, data.score, data.score
FROM (VALUES
    ('Dera Baba Nanak', 'Gurdaspur', 'river_distance', 'Distance to river (Ravi)', 92::numeric),
    ('Dera Baba Nanak', 'Gurdaspur', 'hand', 'Height above drainage', 88::numeric),
    ('Dera Baba Nanak', 'Gurdaspur', 'past_floods', 'Past flood frequency', 90::numeric),
    ('Dera Baba Nanak', 'Gurdaspur', 'land_cover', 'Land cover', 62::numeric),
    ('Dera Baba Nanak', 'Gurdaspur', 'vulnerability', 'Vulnerability index', 78::numeric),
    ('Ramdas', 'Amritsar', 'river_distance', 'Distance to river (Ravi)', 84::numeric),
    ('Ramdas', 'Amritsar', 'hand', 'Height above drainage', 80::numeric),
    ('Ramdas', 'Amritsar', 'past_floods', 'Past flood frequency', 85::numeric),
    ('Ramdas', 'Amritsar', 'land_cover', 'Land cover', 58::numeric),
    ('Ramdas', 'Amritsar', 'vulnerability', 'Vulnerability index', 70::numeric),
    ('Ajnala', 'Amritsar', 'river_distance', 'Distance to river (Ravi)', 70::numeric),
    ('Ajnala', 'Amritsar', 'hand', 'Height above drainage', 66::numeric),
    ('Ajnala', 'Amritsar', 'past_floods', 'Past flood frequency', 72::numeric),
    ('Ajnala', 'Amritsar', 'land_cover', 'Land cover', 55::numeric),
    ('Ajnala', 'Amritsar', 'vulnerability', 'Vulnerability index', 64::numeric),
    ('Gatti Rajoke', 'Ferozepur', 'river_distance', 'Distance to river (Sutlej)', 95::numeric),
    ('Gatti Rajoke', 'Ferozepur', 'hand', 'Height above drainage', 91::numeric),
    ('Gatti Rajoke', 'Ferozepur', 'past_floods', 'Past flood frequency', 93::numeric),
    ('Gatti Rajoke', 'Ferozepur', 'land_cover', 'Land cover', 60::numeric),
    ('Gatti Rajoke', 'Ferozepur', 'vulnerability', 'Vulnerability index', 82::numeric),
    ('Mamdot', 'Ferozepur', 'river_distance', 'Distance to river (Sutlej)', 80::numeric),
    ('Mamdot', 'Ferozepur', 'hand', 'Height above drainage', 76::numeric),
    ('Mamdot', 'Ferozepur', 'past_floods', 'Past flood frequency', 78::numeric),
    ('Mamdot', 'Ferozepur', 'land_cover', 'Land cover', 57::numeric),
    ('Mamdot', 'Ferozepur', 'vulnerability', 'Vulnerability index', 66::numeric),
    ('Fatuhiwala', 'Ferozepur', 'river_distance', 'Distance to river (Sutlej)', 44::numeric),
    ('Fatuhiwala', 'Ferozepur', 'hand', 'Height above drainage', 40::numeric),
    ('Fatuhiwala', 'Ferozepur', 'past_floods', 'Past flood frequency', 46::numeric),
    ('Fatuhiwala', 'Ferozepur', 'land_cover', 'Land cover', 38::numeric),
    ('Fatuhiwala', 'Ferozepur', 'vulnerability', 'Vulnerability index', 48::numeric)
) AS data(name, district, factor_key, label, score)
JOIN settlements AS s ON s.name = data.name AND s.district = data.district
ON CONFLICT (settlement_id, factor_key) DO UPDATE SET
    label = EXCLUDED.label,
    raw_value = EXCLUDED.raw_value,
    risk_score = EXCLUDED.risk_score;

INSERT INTO candidate_sites (
    settlement_id, name, location, hand_m, area_m2, road_distance_km, m2_per_person, suitability_score, capacity
)
SELECT s.id, data.site_name,
       ST_SetSRID(ST_MakePoint(data.lng, data.lat), 4326)::geography,
       data.hand, data.area, data.road, 100, data.score, floor(data.area * 0.60 / 100)::integer
FROM (VALUES
    ('Dera Baba Nanak', 'Gurdaspur', 'Site G-1 (north ridge)', 75.0000::double precision, 32.0750::double precision, 14::numeric, 420000::numeric, 1.8::numeric, 86::numeric),
    ('Dera Baba Nanak', 'Gurdaspur', 'Site G-2', 75.0700, 32.0700, 11, 260000, 3.2, 79),
    ('Ramdas', 'Amritsar', 'Site A-1', 74.8900, 31.9300, 12, 380000, 2.1, 82),
    ('Ramdas', 'Amritsar', 'Site A-2', 74.9600, 31.9300, 10, 300000, 4.0, 74),
    ('Ajnala', 'Amritsar', 'Site A-3', 74.7200, 31.8800, 11, 520000, 1.2, 77),
    ('Gatti Rajoke', 'Ferozepur', 'Site F-1', 74.6400, 30.9700, 13, 210000, 2.6, 84),
    ('Gatti Rajoke', 'Ferozepur', 'Site F-2', 74.5500, 30.9700, 10, 150000, 5.1, 71),
    ('Mamdot', 'Ferozepur', 'Site F-3', 74.4000, 30.9300, 12, 340000, 2.0, 80),
    ('Fatuhiwala', 'Ferozepur', 'Site F-4', 74.4900, 30.9900, 9, 90000, 3.3, 70)
) AS data(name, district, site_name, lng, lat, hand, area, road, score)
JOIN settlements AS s ON s.name = data.name AND s.district = data.district
ON CONFLICT (settlement_id, name) DO UPDATE SET
    location = EXCLUDED.location,
    hand_m = EXCLUDED.hand_m,
    area_m2 = EXCLUDED.area_m2,
    road_distance_km = EXCLUDED.road_distance_km,
    m2_per_person = EXCLUDED.m2_per_person,
    suitability_score = EXCLUDED.suitability_score,
    capacity = EXCLUDED.capacity;

INSERT INTO hazard_zones (name, properties, geom)
VALUES (
    'Illustrative Sutlej flood extent',
    '{"source":"demo seed","severity":"illustrative"}'::jsonb,
    ST_Multi(ST_GeomFromText(
        'POLYGON((74.53 30.90, 74.67 30.91, 74.71 30.98, 74.61 31.02, 74.53 30.90))',
        4326
    ))
)
ON CONFLICT (name) DO UPDATE SET
    properties = EXCLUDED.properties,
    geom = EXCLUDED.geom;

SELECT setval(
    pg_get_serial_sequence('settlements', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM settlements), 1),
    true
);
