-- =============================================================================
-- Seed de test pour valider la recherche multi-critères + spatiale (Phase 8)
-- =============================================================================
-- 10 propriétés réparties géographiquement (Conakry centre + districts +
-- préfectures voisines Coyah/Kindia/Forécariah) avec variations sur prix,
-- chambres, surface, commodités, type annonce/bien.
--
-- Toutes les annonces sont préfixées "[SEED]" → cleanup facile.
-- Idempotent : DELETE avant INSERT.
--
-- Pré-requis : user smoketest-immo@test.local et son profil immo existent.
-- Si absents, ce script les recrée.
--
-- Exécution :
--   docker compose exec -T postgresdb psql -U inno2711 -d innodb \
--     < docs/seed-immo-test.sql
-- =============================================================================

-- Cleanup propriétés [SEED] existantes (cascade sur photos, commodités, etc.)
DELETE FROM immo_propriete WHERE titre LIKE '[SEED]%';

-- S'assurer que l'user de test + profil existent
DO $$
DECLARE
    seed_user_id BIGINT;
    seed_profil_id BIGINT;
    user_role_id BIGINT;
    pwd_hash TEXT := crypt('SmokeTest1234', gen_salt('bf', 12));
BEGIN
    -- User
    SELECT user_id INTO seed_user_id FROM users WHERE email = 'smoketest-immo@test.local';
    IF seed_user_id IS NULL THEN
        INSERT INTO users (user_uuid, username, first_name, last_name, email, phone,
                          enabled, account_non_expired, account_non_locked, auth_provider)
        VALUES (gen_random_uuid()::text, 'smoketest-immo', 'Smoke', 'Test',
                'smoketest-immo@test.local', '+224600000001',
                TRUE, TRUE, TRUE, 'LOCAL')
        RETURNING user_id INTO seed_user_id;

        INSERT INTO credentials (credential_uuid, user_id, password)
        VALUES (gen_random_uuid()::text, seed_user_id, pwd_hash);

        SELECT role_id INTO user_role_id FROM roles WHERE name = 'USER';
        INSERT INTO user_roles (user_id, role_id) VALUES (seed_user_id, user_role_id);
        RAISE NOTICE 'User créé : id=%', seed_user_id;
    END IF;

    -- Profil immo
    SELECT profil_id INTO seed_profil_id FROM immo_profil WHERE user_id = seed_user_id;
    IF seed_profil_id IS NULL THEN
        INSERT INTO immo_profil (user_id, type_profil, statut_verification, bio, telephone_contact)
        VALUES (seed_user_id, 'PROPRIETAIRE_SIMPLE', 'VERIFIE',
                'Seed test', '+224600000001')
        RETURNING profil_id INTO seed_profil_id;
        RAISE NOTICE 'Profil immo créé : id=%', seed_profil_id;
    END IF;
END $$;

-- Lookup ids nécessaires
\set ON_ERROR_STOP on

-- Insertion des 10 propriétés.
-- date_publication ÉCHELONNÉE pour tester un vrai tri par date desc
-- (sinon le tri ressemble à l'ordre d'insertion).
-- Décalage : la propriété #1 publiée il y a 1 jour, #2 il y a 4 jours, etc.
WITH p AS (
    SELECT profil_id FROM immo_profil
    WHERE user_id = (SELECT user_id FROM users WHERE email = 'smoketest-immo@test.local')
    LIMIT 1
),
tb_lookup AS (
    SELECT code, type_bien_id FROM immo_type_bien
)
INSERT INTO immo_propriete (
    profil_id, type_annonce, duree_location, type_bien_id, titre, description,
    prix, devise, periode, nombre_chambres, nombre_salles_bain, surface_m2,
    nombre_etages, mois_caution, mois_avance, mois_honoraire,
    adresse_complete, latitude, longitude,
    date_disponibilite, statut, date_publication, date_expiration,
    nom_contact_public, telephone_contact
)
SELECT
    (SELECT profil_id FROM p),
    s.type_annonce, s.duree_location,
    (SELECT type_bien_id FROM tb_lookup WHERE code = s.type_bien_code),
    s.titre, s.description, s.prix, 'GNF', s.periode,
    s.chambres, s.salles_bain, s.surface,
    s.etages, s.caution, s.avance, s.honoraire,
    s.adresse, s.lat, s.lng,
    CURRENT_DATE + 7, 'PUBLIE',
    -- publication échelonnée : la plus récente il y a 1j, la plus ancienne il y a 40j
    CURRENT_TIMESTAMP - (s.publi_offset_days || ' days')::interval,
    -- expiration = publication + 60 jours
    CURRENT_TIMESTAMP - (s.publi_offset_days || ' days')::interval + INTERVAL '60 days',
    'Smoke Test', '+224600000001'
FROM (VALUES
    -- titre, desc, type_annonce, duree, type_bien, prix, periode, chamb, sb, surface, etages, caution, avance, honoraire, adresse, lat, lng, publi_offset_days
    ('[SEED] Maison luxe Nongo',          '7 grandes chambres climatisées, piscine, garage',
        'LOCATION', 'LONG_SEJOUR',  'MAISON',      35000000, 'PAR_MOIS', 7, 6, 1000,  2, 3, 2, 1,  'Nongo, Ratoma, Conakry',         9.617, -13.617,  1),
    ('[SEED] Appartement moderne Kipé',   'Appartement spacieux 3 chambres, balcon, ascenseur',
        'LOCATION', 'LONG_SEJOUR',  'APPARTEMENT',  5000000, 'PAR_MOIS', 3, 2, 120,   3, 2, 1, 1,  'Kipé, Ratoma, Conakry',          9.595, -13.661,  4),
    ('[SEED] Terrain à vendre Coyah',     'Terrain plat 20 ares, accès route bitumée',
        'VENTE',    NULL,           'TERRAIN',     80000000, 'UNIQUE',   0, 0, 2000, NULL, NULL, NULL, NULL,  'Coyah, route Forécariah',     9.706, -13.392,  8),
    ('[SEED] Boutique Kaloum centre',     'Local commercial 40 m² au cœur de Kaloum',
        'LOCATION', 'LONG_SEJOUR',  'BOUTIQUE',     2500000, 'PAR_MOIS', 0, 1, 40,    0, 3, 2, 1,  'Kaloum centre, Conakry',         9.510, -13.715, 12),
    ('[SEED] Chambre meublée Dixinn',     'Chambre individuelle meublée pour étudiant',
        'LOCATION', 'COURT_SEJOUR', 'CHAMBRE',       800000, 'PAR_MOIS', 1, 1, 20,    0, 1, 1, 0,  'Dixinn, Conakry',                9.553, -13.674, 16),
    ('[SEED] Villa à vendre Ratoma',      '5 chambres, panneaux solaires, générateur',
        'VENTE',    NULL,           'MAISON',     450000000, 'UNIQUE',   5, 4, 600,   2, NULL, NULL, NULL,  'Ratoma centre, Conakry',         9.625, -13.625, 20),
    ('[SEED] Bureau professionnel Matam', 'Espace bureau meublé climatisé, ascenseur',
        'LOCATION', 'LONG_SEJOUR',  'BUREAU',       3000000, 'PAR_MOIS', 0, 1, 80,    0, 2, 1, 1,  'Matam, Conakry',                 9.522, -13.706, 24),
    ('[SEED] Immeuble locatif Kipé',      'Immeuble de 4 étages, idéal investissement',
        'VENTE',    NULL,           'IMMEUBLE',  1500000000, 'UNIQUE',   0, 0, 1500,  4, NULL, NULL, NULL,  'Kipé bord de route, Conakry',     9.598, -13.665, 28),
    ('[SEED] Appartement 2 ch. Forécariah', 'Appartement 2 chambres en préfecture',
        'LOCATION', 'LONG_SEJOUR',  'APPARTEMENT',  1500000, 'PAR_MOIS', 2, 1, 70,    1, 2, 1, 0,  'Forécariah centre',              9.430, -13.092, 32),
    ('[SEED] Grand terrain Kindia',       'Terrain 0.5 hectare en zone résidentielle',
        'VENTE',    NULL,           'TERRAIN',     25000000, 'UNIQUE',   0, 0, 5000, NULL, NULL, NULL, NULL,  'Kindia centre',                 10.058, -12.866, 40)
) AS s(titre, description, type_annonce, duree_location, type_bien_code, prix, periode,
       chambres, salles_bain, surface, etages, caution, avance, honoraire, adresse, lat, lng, publi_offset_days);

-- Association des commodités (par code, vers les propriétés SEED via leur titre)
WITH props AS (SELECT propriete_id, titre FROM immo_propriete WHERE titre LIKE '[SEED]%'),
     codes AS (
         SELECT '[SEED] Maison luxe Nongo'::text          AS titre, unnest(ARRAY['CLIMATISATION','PARKING','CHAUFFE_EAU','RESERVOIR_EAU','SECURITE_PRIVEE']) AS code UNION ALL
         SELECT '[SEED] Appartement moderne Kipé',                  unnest(ARRAY['CLIMATISATION','ASCENSEUR','PARKING']) UNION ALL
         SELECT '[SEED] Boutique Kaloum centre',                    unnest(ARRAY['CLIMATISATION','SECURITE_PRIVEE']) UNION ALL
         SELECT '[SEED] Chambre meublée Dixinn',                    unnest(ARRAY['MEUBLE']) UNION ALL
         SELECT '[SEED] Villa à vendre Ratoma',                     unnest(ARRAY['CLIMATISATION','PARKING','GENERATEUR','PANNEAUX_SOLAIRES','RESERVOIR_EAU']) UNION ALL
         SELECT '[SEED] Bureau professionnel Matam',                unnest(ARRAY['CLIMATISATION','ASCENSEUR','MEUBLE']) UNION ALL
         SELECT '[SEED] Immeuble locatif Kipé',                     unnest(ARRAY['ASCENSEUR','PARKING','SECURITE_PRIVEE','GENERATEUR']) UNION ALL
         SELECT '[SEED] Appartement 2 ch. Forécariah',              unnest(ARRAY['PARKING','RESERVOIR_EAU'])
     )
INSERT INTO immo_propriete_commodite (propriete_id, commodite_id)
SELECT p.propriete_id, c.commodite_id
FROM codes co
JOIN props p ON p.titre = co.titre
JOIN immo_commodite c ON c.code = co.code
ON CONFLICT DO NOTHING;

-- Récap visuel
SELECT reference, titre,
       type_annonce, prix, devise, periode,
       nombre_chambres AS ch, surface_m2 AS m2,
       latitude AS lat, longitude AS lng,
       (SELECT COUNT(*) FROM immo_propriete_commodite WHERE propriete_id = p.propriete_id) AS nb_commodites
FROM immo_propriete p
WHERE titre LIKE '[SEED]%'
ORDER BY propriete_id;
