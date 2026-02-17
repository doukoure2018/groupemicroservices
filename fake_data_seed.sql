-- ============================================================
-- DONNEES DE TEST - BILLETTERIE GN
-- ============================================================
-- Executer apres toutes les migrations (V1-V10)
-- Mot de passe pour tous les utilisateurs: meme que l'admin
-- ============================================================

BEGIN;

-- ============================================================
-- 1. VILLES
-- Regions existantes: 1=Conakry, 2=Kindia, 3=Boké, 4=Mamou,
--   5=Labé, 6=Faranah, 7=Kankan, 8=Nzérékoré
-- ============================================================
INSERT INTO villes (ville_id, ville_uuid, region_id, libelle, code_postal, actif, created_at, updated_at) VALUES
(1,  gen_random_uuid(), 1, 'Conakry',     '001', true, NOW(), NOW()),
(2,  gen_random_uuid(), 1, 'Coyah',       '002', true, NOW(), NOW()),
(3,  gen_random_uuid(), 2, 'Kindia',      '010', true, NOW(), NOW()),
(4,  gen_random_uuid(), 2, 'Télimélé',    '011', true, NOW(), NOW()),
(5,  gen_random_uuid(), 3, 'Boké',        '020', true, NOW(), NOW()),
(6,  gen_random_uuid(), 3, 'Kamsar',      '021', true, NOW(), NOW()),
(7,  gen_random_uuid(), 4, 'Mamou',       '030', true, NOW(), NOW()),
(8,  gen_random_uuid(), 4, 'Dalaba',      '031', true, NOW(), NOW()),
(9,  gen_random_uuid(), 5, 'Labé',        '040', true, NOW(), NOW()),
(10, gen_random_uuid(), 5, 'Pita',        '041', true, NOW(), NOW()),
(11, gen_random_uuid(), 6, 'Faranah',     '050', true, NOW(), NOW()),
(12, gen_random_uuid(), 6, 'Dabola',      '051', true, NOW(), NOW()),
(13, gen_random_uuid(), 7, 'Kankan',      '060', true, NOW(), NOW()),
(14, gen_random_uuid(), 7, 'Siguiri',     '061', true, NOW(), NOW()),
(15, gen_random_uuid(), 8, 'Nzérékoré',   '070', true, NOW(), NOW()),
(16, gen_random_uuid(), 8, 'Guéckédou',   '071', true, NOW(), NOW());

-- ============================================================
-- 2. COMMUNES
-- ============================================================
INSERT INTO communes (commune_id, commune_uuid, ville_id, libelle, actif, created_at, updated_at) VALUES
(1,  gen_random_uuid(), 1,  'Kaloum',             true, NOW(), NOW()),
(2,  gen_random_uuid(), 1,  'Dixinn',             true, NOW(), NOW()),
(3,  gen_random_uuid(), 1,  'Matam',              true, NOW(), NOW()),
(4,  gen_random_uuid(), 1,  'Ratoma',             true, NOW(), NOW()),
(5,  gen_random_uuid(), 1,  'Matoto',             true, NOW(), NOW()),
(6,  gen_random_uuid(), 3,  'Kindia Centre',      true, NOW(), NOW()),
(7,  gen_random_uuid(), 7,  'Mamou Centre',       true, NOW(), NOW()),
(8,  gen_random_uuid(), 9,  'Labé Centre',        true, NOW(), NOW()),
(9,  gen_random_uuid(), 13, 'Kankan Centre',      true, NOW(), NOW()),
(10, gen_random_uuid(), 15, 'Nzérékoré Centre',   true, NOW(), NOW()),
(11, gen_random_uuid(), 5,  'Boké Centre',        true, NOW(), NOW()),
(12, gen_random_uuid(), 11, 'Faranah Centre',     true, NOW(), NOW());

-- ============================================================
-- 3. QUARTIERS
-- ============================================================
INSERT INTO quartiers (quartier_id, quartier_uuid, commune_id, libelle, actif, created_at, updated_at) VALUES
(1,  gen_random_uuid(), 1,  'Boulbinet',           true, NOW(), NOW()),
(2,  gen_random_uuid(), 3,  'Madina',              true, NOW(), NOW()),
(3,  gen_random_uuid(), 5,  'Matoto Marché',       true, NOW(), NOW()),
(4,  gen_random_uuid(), 4,  'Nongo',               true, NOW(), NOW()),
(5,  gen_random_uuid(), 6,  'Centre-Ville Kindia', true, NOW(), NOW()),
(6,  gen_random_uuid(), 7,  'Centre-Ville Mamou',  true, NOW(), NOW()),
(7,  gen_random_uuid(), 8,  'Centre-Ville Labé',   true, NOW(), NOW()),
(8,  gen_random_uuid(), 9,  'Centre-Ville Kankan', true, NOW(), NOW()),
(9,  gen_random_uuid(), 10, 'Centre-Ville Nzérékoré', true, NOW(), NOW()),
(10, gen_random_uuid(), 11, 'Centre-Ville Boké',   true, NOW(), NOW());

-- ============================================================
-- 4. LOCALISATIONS
-- ============================================================
INSERT INTO localisations (localisation_id, localisation_uuid, quartier_id, adresse_complete, latitude, longitude, description, created_at, updated_at) VALUES
(1,  gen_random_uuid(), 2,  'Gare routière de Madina, Conakry',  9.5350,  -13.6820, 'Principale gare routière de Conakry', NOW(), NOW()),
(2,  gen_random_uuid(), 3,  'Gare routière de Matoto, Conakry',  9.5800,  -13.5200, 'Gare secondaire de Conakry', NOW(), NOW()),
(3,  gen_random_uuid(), 5,  'Gare routière de Kindia',           10.0541, -12.8666, 'Gare principale de Kindia', NOW(), NOW()),
(4,  gen_random_uuid(), 6,  'Gare routière de Mamou',            10.3764, -12.0875, 'Gare principale de Mamou', NOW(), NOW()),
(5,  gen_random_uuid(), 7,  'Gare routière de Labé',             11.3183, -12.2861, 'Gare principale de Labé', NOW(), NOW()),
(6,  gen_random_uuid(), 8,  'Gare routière de Kankan',           10.3854, -9.3055,  'Gare principale de Kankan', NOW(), NOW()),
(7,  gen_random_uuid(), 9,  'Gare routière de Nzérékoré',        7.7561,  -8.8178,  'Gare principale de Nzérékoré', NOW(), NOW()),
(8,  gen_random_uuid(), 10, 'Gare routière de Boké',             10.9390, -14.2910, 'Gare principale de Boké', NOW(), NOW()),
(9,  gen_random_uuid(), 1,  'Avenue de la République, Kaloum',    9.5094,  -13.7122, 'Zone commerciale Kaloum', NOW(), NOW()),
(10, gen_random_uuid(), 4,  'Carrefour Nongo, Ratoma',            9.5900,  -13.5900, 'Point relais Nongo', NOW(), NOW());

-- ============================================================
-- 5. SITES (Gares routières)
-- ============================================================
INSERT INTO sites (site_id, site_uuid, localisation_id, nom, description, type_site, capacite_vehicules, telephone, email, horaire_ouverture, horaire_fermeture, actif, created_at, updated_at) VALUES
(1, gen_random_uuid(), 1, 'Gare Routière de Madina',    'Principale gare de Conakry, toutes destinations',     'GARE_ROUTIERE', 50, '+224 622 00 00 01', 'madina@billetterie-gn.com',    '05:00', '22:00', true, NOW(), NOW()),
(2, gen_random_uuid(), 2, 'Gare Routière de Matoto',    'Gare secondaire, destinations proches',                'GARE_ROUTIERE', 30, '+224 622 00 00 02', 'matoto@billetterie-gn.com',    '05:30', '21:00', true, NOW(), NOW()),
(3, gen_random_uuid(), 3, 'Gare Routière de Kindia',    'Gare de Kindia',                                       'GARE_ROUTIERE', 25, '+224 622 00 00 03', 'kindia@billetterie-gn.com',    '05:00', '20:00', true, NOW(), NOW()),
(4, gen_random_uuid(), 4, 'Gare Routière de Mamou',     'Carrefour vers la Moyenne Guinée',                     'GARE_ROUTIERE', 35, '+224 622 00 00 04', 'mamou@billetterie-gn.com',     '05:00', '21:00', true, NOW(), NOW()),
(5, gen_random_uuid(), 5, 'Gare Routière de Labé',      'Capitale de la Moyenne Guinée',                        'GARE_ROUTIERE', 30, '+224 622 00 00 05', 'labe@billetterie-gn.com',      '05:00', '20:00', true, NOW(), NOW()),
(6, gen_random_uuid(), 6, 'Gare Routière de Kankan',    'Capitale de la Haute Guinée',                          'GARE_ROUTIERE', 25, '+224 622 00 00 06', 'kankan@billetterie-gn.com',    '05:30', '20:00', true, NOW(), NOW()),
(7, gen_random_uuid(), 7, 'Gare Routière de Nzérékoré', 'Capitale de la Guinée Forestière',                     'GARE_ROUTIERE', 20, '+224 622 00 00 07', 'nzerekore@billetterie-gn.com', '06:00', '19:00', true, NOW(), NOW()),
(8, gen_random_uuid(), 8, 'Gare Routière de Boké',      'Gare de Boké, Basse Guinée',                           'GARE_ROUTIERE', 20, '+224 622 00 00 08', 'boke@billetterie-gn.com',      '06:00', '19:00', true, NOW(), NOW());

-- ============================================================
-- 6. DEPARTS
-- ============================================================
INSERT INTO departs (depart_id, depart_uuid, site_id, libelle, description, ordre_affichage, actif, created_at, updated_at) VALUES
(1, gen_random_uuid(), 1, 'Conakry - Madina',  'Départ gare de Madina',  1, true, NOW(), NOW()),
(2, gen_random_uuid(), 2, 'Conakry - Matoto',  'Départ gare de Matoto',  2, true, NOW(), NOW()),
(3, gen_random_uuid(), 3, 'Kindia',            'Départ gare de Kindia',  3, true, NOW(), NOW()),
(4, gen_random_uuid(), 4, 'Mamou',             'Départ gare de Mamou',   4, true, NOW(), NOW()),
(5, gen_random_uuid(), 5, 'Labé',              'Départ gare de Labé',    5, true, NOW(), NOW()),
(6, gen_random_uuid(), 6, 'Kankan',            'Départ gare de Kankan',  6, true, NOW(), NOW()),
(7, gen_random_uuid(), 7, 'Nzérékoré',         'Départ gare de Nzérékoré', 7, true, NOW(), NOW()),
(8, gen_random_uuid(), 8, 'Boké',              'Départ gare de Boké',    8, true, NOW(), NOW());

-- ============================================================
-- 7. ARRIVEES
-- ============================================================
INSERT INTO arrivees (arrivee_id, arrivee_uuid, site_id, depart_id, libelle, libelle_depart, ordre_affichage, actif, created_at, updated_at) VALUES
(1,  gen_random_uuid(), 3, 1, 'Kindia',            'Conakry - Madina', 1, true, NOW(), NOW()),
(2,  gen_random_uuid(), 4, 1, 'Mamou',             'Conakry - Madina', 2, true, NOW(), NOW()),
(3,  gen_random_uuid(), 5, 1, 'Labé',              'Conakry - Madina', 3, true, NOW(), NOW()),
(4,  gen_random_uuid(), 6, 1, 'Kankan',            'Conakry - Madina', 4, true, NOW(), NOW()),
(5,  gen_random_uuid(), 7, 1, 'Nzérékoré',         'Conakry - Madina', 5, true, NOW(), NOW()),
(6,  gen_random_uuid(), 8, 1, 'Boké',              'Conakry - Madina', 6, true, NOW(), NOW()),
(7,  gen_random_uuid(), 4, 3, 'Mamou',             'Kindia',           1, true, NOW(), NOW()),
(8,  gen_random_uuid(), 1, 3, 'Conakry - Madina',  'Kindia',           2, true, NOW(), NOW()),
(9,  gen_random_uuid(), 5, 4, 'Labé',              'Mamou',            1, true, NOW(), NOW()),
(10, gen_random_uuid(), 1, 4, 'Conakry - Madina',  'Mamou',            2, true, NOW(), NOW()),
(11, gen_random_uuid(), 1, 5, 'Conakry - Madina',  'Labé',             1, true, NOW(), NOW()),
(12, gen_random_uuid(), 1, 6, 'Conakry - Madina',  'Kankan',           1, true, NOW(), NOW());

-- ============================================================
-- 8. UTILISATEURS (Transporteurs + Clients)
-- ============================================================
INSERT INTO users (user_id, user_uuid, username, first_name, last_name, email, phone, address, bio, image_url, login_attempts, mfa, enabled, account_non_expired, account_non_locked, auth_provider, created_at, updated_at) VALUES
-- Transporteurs
(10, gen_random_uuid(), 'amadou.diallo',     'Amadou',    'Diallo',  'amadou.diallo@billetterie-gn.com',  '+224 621 11 11 11', 'Madina, Conakry',   'Transporteur 15 ans expérience',            'https://cdn-icons-png.flaticon.com/512/149/149071.png', 0, false, true, true, true, 'LOCAL', NOW(), NOW()),
(11, gen_random_uuid(), 'mamadou.barry',     'Mamadou',   'Barry',   'mamadou.barry@billetterie-gn.com',  '+224 622 22 22 22', 'Kindia Centre',     'PDG Trans-Guinée Express',                  'https://cdn-icons-png.flaticon.com/512/149/149071.png', 0, false, true, true, true, 'LOCAL', NOW(), NOW()),
(12, gen_random_uuid(), 'ibrahima.sow',      'Ibrahima',  'Sow',     'ibrahima.sow@billetterie-gn.com',   '+224 623 33 33 33', 'Mamou Centre',      'Transporteur Mamou-Labé',                   'https://cdn-icons-png.flaticon.com/512/149/149071.png', 0, false, true, true, true, 'LOCAL', NOW(), NOW()),
-- Clients
(13, gen_random_uuid(), 'fatoumata.camara',  'Fatoumata', 'Camara',  'fatoumata.camara@gmail.com',        '+224 624 44 44 44', 'Ratoma, Conakry',   'Voyageuse fréquente',                       'https://cdn-icons-png.flaticon.com/512/149/149071.png', 0, false, true, true, true, 'LOCAL', NOW(), NOW()),
(14, gen_random_uuid(), 'ousmane.bah',       'Ousmane',   'Bah',     'ousmane.bah@gmail.com',             '+224 625 55 55 55', 'Dixinn, Conakry',   'Commerçant',                                'https://cdn-icons-png.flaticon.com/512/149/149071.png', 0, false, true, true, true, 'LOCAL', NOW(), NOW()),
(15, gen_random_uuid(), 'mariama.sylla',     'Mariama',   'Sylla',   'mariama.sylla@gmail.com',           '+224 626 66 66 66', 'Labé Centre',       'Étudiante',                                 'https://cdn-icons-png.flaticon.com/512/149/149071.png', 0, false, true, true, true, 'LOCAL', NOW(), NOW()),
(16, gen_random_uuid(), 'alpha.conde',       'Alpha',     'Condé',   'alpha.conde@gmail.com',             '+224 627 77 77 77', 'Kankan Centre',     'Fonctionnaire',                             'https://cdn-icons-png.flaticon.com/512/149/149071.png', 0, false, true, true, true, 'LOCAL', NOW(), NOW()),
(17, gen_random_uuid(), 'aissatou.diallo',   'Aïssatou',  'Diallo',  'aissatou.diallo@gmail.com',         '+224 628 88 88 88', 'Matoto, Conakry',   'Infirmière',                                'https://cdn-icons-png.flaticon.com/512/149/149071.png', 0, false, true, true, true, 'LOCAL', NOW(), NOW());

-- Credentials (meme mot de passe que l'admin)
INSERT INTO credentials (credential_uuid, user_id, password, created_at, updated_at) VALUES
(gen_random_uuid(), 10, '$2a$12$.Ij3d6B03dff0mRTiygaKe26oFXoKOeniewxdRgecM1PnNH1Dz2Jq', NOW(), NOW()),
(gen_random_uuid(), 11, '$2a$12$.Ij3d6B03dff0mRTiygaKe26oFXoKOeniewxdRgecM1PnNH1Dz2Jq', NOW(), NOW()),
(gen_random_uuid(), 12, '$2a$12$.Ij3d6B03dff0mRTiygaKe26oFXoKOeniewxdRgecM1PnNH1Dz2Jq', NOW(), NOW()),
(gen_random_uuid(), 13, '$2a$12$.Ij3d6B03dff0mRTiygaKe26oFXoKOeniewxdRgecM1PnNH1Dz2Jq', NOW(), NOW()),
(gen_random_uuid(), 14, '$2a$12$.Ij3d6B03dff0mRTiygaKe26oFXoKOeniewxdRgecM1PnNH1Dz2Jq', NOW(), NOW()),
(gen_random_uuid(), 15, '$2a$12$.Ij3d6B03dff0mRTiygaKe26oFXoKOeniewxdRgecM1PnNH1Dz2Jq', NOW(), NOW()),
(gen_random_uuid(), 16, '$2a$12$.Ij3d6B03dff0mRTiygaKe26oFXoKOeniewxdRgecM1PnNH1Dz2Jq', NOW(), NOW()),
(gen_random_uuid(), 17, '$2a$12$.Ij3d6B03dff0mRTiygaKe26oFXoKOeniewxdRgecM1PnNH1Dz2Jq', NOW(), NOW());

-- Roles: Transporteurs=MANAGER(3), Clients=USER(1)
INSERT INTO user_roles (user_id, role_id) VALUES
(10, 3), (11, 3), (12, 3),
(13, 1), (14, 1), (15, 1), (16, 1), (17, 1);

-- ============================================================
-- 9. VEHICULES
-- Types: 1=Bus, 2=Minibus, 3=Taxi-brousse, 4=4x4, 5=Van
-- ============================================================
INSERT INTO vehicules (vehicule_id, vehicule_uuid, user_id, type_vehicule_id, immatriculation, marque, modele, annee_fabrication, nombre_places, nom_chauffeur, contact_chauffeur, contact_proprietaire, couleur, climatise, statut, note_moyenne, nombre_avis, created_at, updated_at) VALUES
(1,  gen_random_uuid(), 10, 1, 'RC-1234-A', 'Mercedes-Benz', 'Sprinter 516',  2022, 50, 'Sékou Touré',     '+224 620 10 10 10', '+224 621 11 11 11', 'Blanc',        true,  'ACTIF', 4.50, 2, NOW(), NOW()),
(2,  gen_random_uuid(), 10, 2, 'RC-1235-A', 'Toyota',        'HiAce',         2021, 18, 'Moussa Keita',    '+224 620 10 10 11', '+224 621 11 11 11', 'Bleu',         true,  'ACTIF', 4.20, 0, NOW(), NOW()),
(3,  gen_random_uuid(), 10, 3, 'RC-1236-A', 'Peugeot',       '504 Break',     2019,  7, 'Fodé Camara',     '+224 620 10 10 12', '+224 621 11 11 11', 'Jaune',        false, 'ACTIF', 3.80, 0, NOW(), NOW()),
(4,  gen_random_uuid(), 11, 1, 'RC-2001-B', 'Yutong',        'ZK6122H9',      2023, 55, 'Abdoulaye Baldé', '+224 620 20 20 20', '+224 622 22 22 22', 'Orange/Blanc', true,  'ACTIF', 4.70, 2, NOW(), NOW()),
(5,  gen_random_uuid(), 11, 1, 'RC-2002-B', 'Yutong',        'ZK6122H9',      2023, 55, 'Thierno Diallo',  '+224 620 20 20 21', '+224 622 22 22 22', 'Orange/Blanc', true,  'ACTIF', 3.50, 2, NOW(), NOW()),
(6,  gen_random_uuid(), 11, 2, 'RC-2003-B', 'Toyota',        'Coaster',       2022, 30, 'Alseny Sylla',    '+224 620 20 20 22', '+224 622 22 22 22', 'Blanc',        true,  'ACTIF', 4.30, 0, NOW(), NOW()),
(7,  gen_random_uuid(), 11, 5, 'RC-2004-B', 'Mercedes-Benz', 'Vito',          2021,  9, 'Boubacar Bah',    '+224 620 20 20 23', '+224 622 22 22 22', 'Noir',         true,  'ACTIF', 4.80, 0, NOW(), NOW()),
(8,  gen_random_uuid(), 12, 2, 'RC-3001-C', 'Toyota',        'HiAce',         2020, 15, 'Mamadou Sow',     '+224 620 30 30 30', '+224 623 33 33 33', 'Vert',         false, 'ACTIF', 4.10, 0, NOW(), NOW()),
(9,  gen_random_uuid(), 12, 4, 'RC-3002-C', 'Toyota',        'Land Cruiser',  2021,  7, 'Cellou Diallo',   '+224 620 30 30 31', '+224 623 33 33 33', 'Gris',         true,  'ACTIF', 4.40, 0, NOW(), NOW()),
(10, gen_random_uuid(), 12, 3, 'RC-3003-C', 'Renault',       'Master',        2018,  9, 'Oumar Barry',     '+224 620 30 30 32', '+224 623 33 33 33', 'Blanc',        false, 'EN_MAINTENANCE', 3.50, 0, NOW(), NOW());

-- ============================================================
-- 10. TRAJETS (Routes)
-- ============================================================
INSERT INTO trajets (trajet_id, trajet_uuid, depart_id, arrivee_id, user_id, libelle_trajet, distance_km, duree_estimee_minutes, montant_base, montant_bagages, devise, description, actif, created_at, updated_at) VALUES
(1,  gen_random_uuid(), 1, 1,  10, 'Conakry → Kindia',    135,  180, 80000,  10000, 'GNF', 'Via la RN1',                       true, NOW(), NOW()),
(2,  gen_random_uuid(), 1, 2,  10, 'Conakry → Mamou',     300,  360, 150000, 15000, 'GNF', 'Via Kindia',                       true, NOW(), NOW()),
(3,  gen_random_uuid(), 1, 3,  11, 'Conakry → Labé',      450,  540, 200000, 20000, 'GNF', 'Via Mamou',                        true, NOW(), NOW()),
(4,  gen_random_uuid(), 1, 4,  11, 'Conakry → Kankan',    600,  660, 300000, 25000, 'GNF', 'Via Mamou et Kouroussa',           true, NOW(), NOW()),
(5,  gen_random_uuid(), 1, 5,  11, 'Conakry → Nzérékoré', 950,  900, 350000, 30000, 'GNF', 'Via Mamou et Kissidougou',         true, NOW(), NOW()),
(6,  gen_random_uuid(), 1, 6,  10, 'Conakry → Boké',      300,  300, 150000, 15000, 'GNF', 'Via Boffa',                        true, NOW(), NOW()),
(7,  gen_random_uuid(), 3, 7,  10, 'Kindia → Mamou',      165,  180, 70000,  10000, 'GNF', 'Route directe',                    true, NOW(), NOW()),
(8,  gen_random_uuid(), 4, 9,  12, 'Mamou → Labé',        150,  180, 80000,  10000, 'GNF', 'Via Pita',                         true, NOW(), NOW()),
(9,  gen_random_uuid(), 5, 11, 12, 'Labé → Conakry',      450,  540, 200000, 20000, 'GNF', 'Retour via Mamou',                 true, NOW(), NOW()),
(10, gen_random_uuid(), 4, 10, 12, 'Mamou → Conakry',     300,  360, 150000, 15000, 'GNF', 'Retour via Kindia',                true, NOW(), NOW());

-- ============================================================
-- 11. OFFRES (Voyages programmés)
-- ============================================================
INSERT INTO offres (offre_id, offre_uuid, token_offre, trajet_id, vehicule_id, user_id, date_depart, heure_depart, heure_arrivee_estimee, nombre_places_total, nombre_places_disponibles, nombre_places_reservees, montant, montant_promotion, devise, statut, niveau_remplissage, point_rencontre, annulation_autorisee, delai_annulation_heures, date_publication, created_at, updated_at) VALUES
-- Offres ouvertes (futures)
(1,  gen_random_uuid(), 'OFF-20260218-001', 1,  1, 10, '2026-02-18', '06:00', '09:00', 50, 35, 15, 80000,  NULL,   'GNF', 'OUVERT',     30,  'Gare Madina, quai 3', true,  24, NOW(), NOW(), NOW()),
(2,  gen_random_uuid(), 'OFF-20260218-002', 2,  4, 11, '2026-02-18', '07:00', '13:00', 55, 20, 35, 150000, 135000, 'GNF', 'OUVERT',     64,  'Gare Madina, quai 1', true,  12, NOW(), NOW(), NOW()),
(3,  gen_random_uuid(), 'OFF-20260218-003', 3,  5, 11, '2026-02-18', '06:30', '15:30', 55, 10, 45, 200000, NULL,   'GNF', 'OUVERT',     82,  'Gare Madina, quai 2', true,  24, NOW(), NOW(), NOW()),
(4,  gen_random_uuid(), 'OFF-20260219-001', 4,  4, 11, '2026-02-19', '05:30', '16:30', 55, 40, 15, 300000, 280000, 'GNF', 'OUVERT',     27,  'Gare Madina, quai 1', true,  48, NOW(), NOW(), NOW()),
(5,  gen_random_uuid(), 'OFF-20260219-002', 5,  1, 10, '2026-02-19', '05:00', '20:00', 50, 42,  8, 350000, NULL,   'GNF', 'OUVERT',     16,  'Gare Madina, quai 3', true,  48, NOW(), NOW(), NOW()),
(6,  gen_random_uuid(), 'OFF-20260219-003', 8,  8, 12, '2026-02-19', '08:00', '11:00', 15,  8,  7, 80000,  NULL,   'GNF', 'OUVERT',     47,  'Gare Mamou, quai 2',  true,  12, NOW(), NOW(), NOW()),
(7,  gen_random_uuid(), 'OFF-20260220-001', 1,  2, 10, '2026-02-20', '08:00', '11:00', 18, 18,  0, 80000,  70000,  'GNF', 'EN_ATTENTE',  0,  'Gare Madina, quai 5', true,  24, NOW(), NOW(), NOW()),
(8,  gen_random_uuid(), 'OFF-20260220-002', 6,  6, 11, '2026-02-20', '07:00', '12:00', 30, 30,  0, 150000, NULL,   'GNF', 'EN_ATTENTE',  0,  'Gare Madina, quai 4', true,  24, NOW(), NOW(), NOW()),
-- Offres terminées (passées)
(9,  gen_random_uuid(), 'OFF-20260215-001', 1,  1, 10, '2026-02-15', '06:00', '09:00', 50,  0, 50, 80000,  NULL,   'GNF', 'TERMINE',   100, 'Gare Madina, quai 3', false, 24, NOW()-INTERVAL '3 days', NOW()-INTERVAL '3 days', NOW()),
(10, gen_random_uuid(), 'OFF-20260215-002', 3,  5, 11, '2026-02-15', '07:00', '16:00', 55,  5, 50, 200000, NULL,   'GNF', 'TERMINE',    91, 'Gare Madina, quai 1', false, 24, NOW()-INTERVAL '3 days', NOW()-INTERVAL '3 days', NOW()),
(11, gen_random_uuid(), 'OFF-20260216-001', 2,  4, 11, '2026-02-16', '06:30', '12:30', 55,  2, 53, 150000, NULL,   'GNF', 'TERMINE',    96, 'Gare Madina, quai 2', false, 12, NOW()-INTERVAL '2 days', NOW()-INTERVAL '2 days', NOW()),
-- Annulée
(12, gen_random_uuid(), 'OFF-20260217-001', 4,  6, 11, '2026-02-17', '06:00', '17:00', 30, 30,  0, 300000, NULL,   'GNF', 'ANNULE',      0, 'Gare Madina',         true,  24, NOW()-INTERVAL '1 day', NOW()-INTERVAL '1 day', NOW()),
-- Complète
(13, gen_random_uuid(), 'OFF-20260218-004', 8,  9, 12, '2026-02-18', '07:30', '10:30',  7,  0,  7, 80000,  NULL,   'GNF', 'COMPLET',   100, 'Gare Mamou',          true,  12, NOW(), NOW(), NOW()),
-- En cours
(14, gen_random_uuid(), 'OFF-20260217-002', 1,  2, 10, '2026-02-17', '14:00', '17:00', 18,  3, 15, 80000,  NULL,   'GNF', 'EN_COURS',   83, 'Gare Madina, quai 5', false,  0, NOW()-INTERVAL '4 hours', NOW()-INTERVAL '4 hours', NOW()),
-- Future retour
(15, gen_random_uuid(), 'OFF-20260221-001', 9,  8, 12, '2026-02-21', '07:00', '16:00', 15, 12,  3, 200000, 180000, 'GNF', 'OUVERT',     20, 'Gare Labé',           true,  24, NOW(), NOW(), NOW());

COMMIT;
