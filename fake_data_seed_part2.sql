-- ============================================================
-- DONNEES DE TEST - PARTIE 2
-- Commandes, Billets, Paiements, Avis, Notifications, Partenaires
-- ============================================================
-- Executer APRES fake_data_seed.sql
-- modes_reglement: 1=CASH, 2=OM, 3=MOMO, 4=CM, 5=CB, 6=VIREMENT
-- ============================================================

BEGIN;

-- ============================================================
-- 12. COMMANDES (Réservations)
-- Désactiver les triggers pour insérer en batch
-- ============================================================
ALTER TABLE commandes DISABLE TRIGGER generate_commande_numero;
ALTER TABLE commandes DISABLE TRIGGER update_offre_places;

INSERT INTO commandes (commande_id, commande_uuid, numero_commande, offre_id, user_id, mode_reglement_id, nombre_places, montant_unitaire, montant_total, montant_frais, montant_remise, montant_paye, devise, statut, date_reservation, date_confirmation, date_paiement, date_annulation, motif_annulation, reference_paiement, notes, created_at, updated_at) VALUES
-- Réservations payées (offres futures)
(1,  gen_random_uuid(), 'CMD-20260216-0001', 1,  13, 2, 2, 80000,  160000, 1600,  0, 161600, 'GNF', 'PAYEE',      NOW()-INTERVAL '1 day',  NOW()-INTERVAL '1 day',  NOW()-INTERVAL '1 day',  NULL, NULL, 'OM-PAY-001',   'Voyage famille',       NOW()-INTERVAL '1 day', NOW()),
(2,  gen_random_uuid(), 'CMD-20260215-0001', 1,  14, 1, 1, 80000,  80000,  0,     0, 80000,  'GNF', 'PAYEE',      NOW()-INTERVAL '2 days', NOW()-INTERVAL '2 days', NOW()-INTERVAL '2 days', NULL, NULL, 'CASH-001',     NULL,                   NOW()-INTERVAL '2 days', NOW()),
(3,  gen_random_uuid(), 'CMD-20260216-0002', 2,  15, 3, 3, 135000, 405000, 4050,  0, 409050, 'GNF', 'PAYEE',      NOW()-INTERVAL '1 day',  NOW()-INTERVAL '1 day',  NOW()-INTERVAL '1 day',  NULL, NULL, 'MOMO-PAY-001', 'Groupe étudiants',     NOW()-INTERVAL '1 day', NOW()),
(4,  gen_random_uuid(), 'CMD-20260214-0001', 3,  16, 2, 1, 200000, 200000, 2000,  0, 202000, 'GNF', 'PAYEE',      NOW()-INTERVAL '3 days', NOW()-INTERVAL '3 days', NOW()-INTERVAL '2 days', NULL, NULL, 'OM-PAY-002',   NULL,                   NOW()-INTERVAL '3 days', NOW()),
(5,  gen_random_uuid(), 'CMD-20260217-0001', 4,  17, 5, 2, 280000, 560000, 11200, 0, 571200, 'GNF', 'CONFIRMEE',  NOW(),                   NOW(),                   NULL,                    NULL, NULL, NULL,            'Attente paiement CB',  NOW(), NOW()),
(6,  gen_random_uuid(), 'CMD-20260216-0003', 6,  13, 2, 1, 80000,  80000,  800,   0, 80800,  'GNF', 'PAYEE',      NOW()-INTERVAL '1 day',  NOW()-INTERVAL '1 day',  NOW()-INTERVAL '1 day',  NULL, NULL, 'OM-PAY-003',   NULL,                   NOW()-INTERVAL '1 day', NOW()),
(7,  gen_random_uuid(), 'CMD-20260215-0002', 13, 14, 1, 2, 80000,  160000, 0,     0, 160000, 'GNF', 'PAYEE',      NOW()-INTERVAL '2 days', NOW()-INTERVAL '2 days', NOW()-INTERVAL '2 days', NULL, NULL, 'CASH-002',     NULL,                   NOW()-INTERVAL '2 days', NOW()),
-- En attente
(8,  gen_random_uuid(), 'CMD-20260217-0002', 1,  17, NULL, 1, 80000,  80000,  0, 0, 0, 'GNF', 'EN_ATTENTE', NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(9,  gen_random_uuid(), 'CMD-20260217-0003', 3,  14, NULL, 2, 200000, 400000, 0, 0, 0, 'GNF', 'EN_ATTENTE', NOW(), NULL, NULL, NULL, NULL, NULL, 'Places côté fenêtre SVP', NOW(), NOW()),
-- Annulée
(10, gen_random_uuid(), 'CMD-20260215-0003', 2,  16, 2, 1, 135000, 135000, 1350, 0, 0, 'GNF', 'ANNULEE', NOW()-INTERVAL '2 days', NOW()-INTERVAL '2 days', NULL, NOW()-INTERVAL '1 day', 'Changement de programme', NULL, NULL, NOW()-INTERVAL '2 days', NOW()),
-- Utilisées (voyages passés)
(11, gen_random_uuid(), 'CMD-20260213-0001', 9,  13, 2, 3, 80000,  240000, 2400,  0, 242400, 'GNF', 'UTILISEE', NOW()-INTERVAL '4 days', NOW()-INTERVAL '4 days', NOW()-INTERVAL '4 days', NULL, NULL, 'OM-PAY-004', NULL, NOW()-INTERVAL '4 days', NOW()),
(12, gen_random_uuid(), 'CMD-20260212-0001', 9,  14, 1, 1, 80000,  80000,  0,     0, 80000,  'GNF', 'UTILISEE', NOW()-INTERVAL '5 days', NOW()-INTERVAL '5 days', NOW()-INTERVAL '5 days', NULL, NULL, 'CASH-003',   NULL, NOW()-INTERVAL '5 days', NOW()),
(13, gen_random_uuid(), 'CMD-20260213-0002', 10, 15, 3, 2, 200000, 400000, 4000,  0, 404000, 'GNF', 'UTILISEE', NOW()-INTERVAL '4 days', NOW()-INTERVAL '4 days', NOW()-INTERVAL '4 days', NULL, NULL, 'MOMO-PAY-002', NULL, NOW()-INTERVAL '4 days', NOW()),
(14, gen_random_uuid(), 'CMD-20260214-0002', 11, 16, 2, 1, 150000, 150000, 1500,  0, 151500, 'GNF', 'UTILISEE', NOW()-INTERVAL '3 days', NOW()-INTERVAL '3 days', NOW()-INTERVAL '3 days', NULL, NULL, 'OM-PAY-005', NULL, NOW()-INTERVAL '3 days', NOW()),
(15, gen_random_uuid(), 'CMD-20260214-0003', 11, 17, 1, 2, 150000, 300000, 0,     0, 300000, 'GNF', 'UTILISEE', NOW()-INTERVAL '3 days', NOW()-INTERVAL '3 days', NOW()-INTERVAL '3 days', NULL, NULL, 'CASH-004',   NULL, NOW()-INTERVAL '3 days', NOW()),
-- Remboursée
(16, gen_random_uuid(), 'CMD-20260213-0003', 10, 17, 2, 1, 200000, 200000, 2000, 0, 202000, 'GNF', 'REMBOURSEE', NOW()-INTERVAL '4 days', NOW()-INTERVAL '4 days', NOW()-INTERVAL '4 days', NOW()-INTERVAL '3 days', 'Véhicule en panne', 'OM-PAY-006', NULL, NOW()-INTERVAL '4 days', NOW()),
-- En cours
(17, gen_random_uuid(), 'CMD-20260217-0004', 14, 13, 2, 2, 80000, 160000, 1600, 0, 161600, 'GNF', 'PAYEE', NOW()-INTERVAL '5 hours', NOW()-INTERVAL '5 hours', NOW()-INTERVAL '5 hours', NULL, NULL, 'OM-PAY-007', NULL, NOW()-INTERVAL '5 hours', NOW()),
(18, gen_random_uuid(), 'CMD-20260217-0005', 15, 15, 3, 1, 180000, 180000, 1800, 0, 181800, 'GNF', 'PAYEE', NOW(), NOW(), NOW(), NULL, NULL, 'MOMO-PAY-003', 'Retour Labé', NOW(), NOW());

-- Réactiver les triggers
ALTER TABLE commandes ENABLE TRIGGER generate_commande_numero;
ALTER TABLE commandes ENABLE TRIGGER update_offre_places;

-- ============================================================
-- 13. BILLETS (Tickets)
-- ============================================================
INSERT INTO billets (billet_uuid, commande_id, code_billet, numero_siege, nom_passager, telephone_passager, statut, created_at, updated_at) VALUES
-- Commande 1 (2 places, Conakry→Kindia)
(gen_random_uuid(), 1,  'TKT-A0010001', 'A12', 'Fatoumata Camara', '+224 624 44 44 44', 'VALIDE',  NOW(), NOW()),
(gen_random_uuid(), 1,  'TKT-A0010002', 'A13', 'Mamadou Camara',   '+224 624 44 44 45', 'VALIDE',  NOW(), NOW()),
-- Commande 2 (1 place)
(gen_random_uuid(), 2,  'TKT-A0020001', 'B05', 'Ousmane Bah',      '+224 625 55 55 55', 'VALIDE',  NOW(), NOW()),
-- Commande 3 (3 places, Conakry→Mamou)
(gen_random_uuid(), 3,  'TKT-A0030001', 'C01', 'Mariama Sylla',    '+224 626 66 66 66', 'VALIDE',  NOW(), NOW()),
(gen_random_uuid(), 3,  'TKT-A0030002', 'C02', 'Kadiatou Sylla',   '+224 626 66 66 67', 'VALIDE',  NOW(), NOW()),
(gen_random_uuid(), 3,  'TKT-A0030003', 'C03', 'Aminata Sylla',    '+224 626 66 66 68', 'VALIDE',  NOW(), NOW()),
-- Commande 4 (1 place, Conakry→Labé)
(gen_random_uuid(), 4,  'TKT-A0040001', 'D10', 'Alpha Condé',      '+224 627 77 77 77', 'VALIDE',  NOW(), NOW()),
-- Commande 6 (1 place, Mamou→Labé)
(gen_random_uuid(), 6,  'TKT-A0060001', 'A01', 'Fatoumata Camara', '+224 624 44 44 44', 'VALIDE',  NOW(), NOW()),
-- Commande 7 (2 places, Mamou→Labé complet)
(gen_random_uuid(), 7,  'TKT-A0070001', 'A01', 'Ousmane Bah',      '+224 625 55 55 55', 'VALIDE',  NOW(), NOW()),
(gen_random_uuid(), 7,  'TKT-A0070002', 'A02', 'Ibrahima Bah',     '+224 625 55 55 56', 'VALIDE',  NOW(), NOW()),
-- Commande 11 (3 places, passé - UTILISE)
(gen_random_uuid(), 11, 'TKT-B0110001', 'A01', 'Fatoumata Camara', '+224 624 44 44 44', 'UTILISE', NOW()-INTERVAL '3 days', NOW()),
(gen_random_uuid(), 11, 'TKT-B0110002', 'A02', 'Alhassane Camara', '+224 624 44 44 46', 'UTILISE', NOW()-INTERVAL '3 days', NOW()),
(gen_random_uuid(), 11, 'TKT-B0110003', 'A03', 'Hadja Camara',     '+224 624 44 44 47', 'UTILISE', NOW()-INTERVAL '3 days', NOW()),
-- Commande 12 (1 place, passé)
(gen_random_uuid(), 12, 'TKT-B0120001', 'B01', 'Ousmane Bah',      '+224 625 55 55 55', 'UTILISE', NOW()-INTERVAL '3 days', NOW()),
-- Commande 13 (2 places, passé)
(gen_random_uuid(), 13, 'TKT-B0130001', 'C01', 'Mariama Sylla',    '+224 626 66 66 66', 'UTILISE', NOW()-INTERVAL '2 days', NOW()),
(gen_random_uuid(), 13, 'TKT-B0130002', 'C02', 'Souleymane Sylla', '+224 626 66 66 69', 'UTILISE', NOW()-INTERVAL '2 days', NOW()),
-- Commande 14 (1 place, passé)
(gen_random_uuid(), 14, 'TKT-B0140001', 'D01', 'Alpha Condé',      '+224 627 77 77 77', 'UTILISE', NOW()-INTERVAL '1 day', NOW()),
-- Commande 15 (2 places, passé)
(gen_random_uuid(), 15, 'TKT-B0150001', 'E01', 'Aïssatou Diallo',  '+224 628 88 88 88', 'UTILISE', NOW()-INTERVAL '1 day', NOW()),
(gen_random_uuid(), 15, 'TKT-B0150002', 'E02', 'Mamadou Diallo',   '+224 628 88 88 89', 'UTILISE', NOW()-INTERVAL '1 day', NOW()),
-- Commande 16 (annulé/remboursé)
(gen_random_uuid(), 16, 'TKT-B0160001', 'F01', 'Aïssatou Diallo',  '+224 628 88 88 88', 'ANNULE',  NOW()-INTERVAL '3 days', NOW()),
-- Commande 17 (en cours)
(gen_random_uuid(), 17, 'TKT-C0170001', 'A05', 'Fatoumata Camara', '+224 624 44 44 44', 'VALIDE',  NOW()-INTERVAL '5 hours', NOW()),
(gen_random_uuid(), 17, 'TKT-C0170002', 'A06', 'Mohamed Camara',   '+224 624 44 44 48', 'VALIDE',  NOW()-INTERVAL '5 hours', NOW()),
-- Commande 18 (retour Labé)
(gen_random_uuid(), 18, 'TKT-C0180001', 'B01', 'Mariama Sylla',    '+224 626 66 66 66', 'VALIDE',  NOW(), NOW());

-- ============================================================
-- 14. PAIEMENTS
-- ============================================================
INSERT INTO paiements (paiement_uuid, commande_id, mode_reglement_id, montant, devise, reference_externe, statut, date_transaction, date_confirmation, created_at, updated_at) VALUES
(gen_random_uuid(), 1,  2, 161600, 'GNF', 'OM-TXN-001',   'REUSSI',    NOW()-INTERVAL '1 day',  NOW()-INTERVAL '1 day',  NOW(), NOW()),
(gen_random_uuid(), 2,  1, 80000,  'GNF', 'CASH-TXN-001', 'REUSSI',    NOW()-INTERVAL '2 days', NOW()-INTERVAL '2 days', NOW(), NOW()),
(gen_random_uuid(), 3,  3, 409050, 'GNF', 'MOMO-TXN-001', 'REUSSI',    NOW()-INTERVAL '1 day',  NOW()-INTERVAL '1 day',  NOW(), NOW()),
(gen_random_uuid(), 4,  2, 202000, 'GNF', 'OM-TXN-002',   'REUSSI',    NOW()-INTERVAL '2 days', NOW()-INTERVAL '2 days', NOW(), NOW()),
(gen_random_uuid(), 6,  2, 80800,  'GNF', 'OM-TXN-003',   'REUSSI',    NOW()-INTERVAL '1 day',  NOW()-INTERVAL '1 day',  NOW(), NOW()),
(gen_random_uuid(), 7,  1, 160000, 'GNF', 'CASH-TXN-002', 'REUSSI',    NOW()-INTERVAL '2 days', NOW()-INTERVAL '2 days', NOW(), NOW()),
(gen_random_uuid(), 11, 2, 242400, 'GNF', 'OM-TXN-004',   'REUSSI',    NOW()-INTERVAL '4 days', NOW()-INTERVAL '4 days', NOW(), NOW()),
(gen_random_uuid(), 12, 1, 80000,  'GNF', 'CASH-TXN-003', 'REUSSI',    NOW()-INTERVAL '5 days', NOW()-INTERVAL '5 days', NOW(), NOW()),
(gen_random_uuid(), 13, 3, 404000, 'GNF', 'MOMO-TXN-002', 'REUSSI',    NOW()-INTERVAL '4 days', NOW()-INTERVAL '4 days', NOW(), NOW()),
(gen_random_uuid(), 14, 2, 151500, 'GNF', 'OM-TXN-005',   'REUSSI',    NOW()-INTERVAL '3 days', NOW()-INTERVAL '3 days', NOW(), NOW()),
(gen_random_uuid(), 15, 1, 300000, 'GNF', 'CASH-TXN-004', 'REUSSI',    NOW()-INTERVAL '3 days', NOW()-INTERVAL '3 days', NOW(), NOW()),
(gen_random_uuid(), 16, 2, 202000, 'GNF', 'OM-TXN-006',   'REMBOURSE', NOW()-INTERVAL '4 days', NOW()-INTERVAL '3 days', NOW(), NOW()),
(gen_random_uuid(), 17, 2, 161600, 'GNF', 'OM-TXN-007',   'REUSSI',    NOW()-INTERVAL '5 hours', NOW()-INTERVAL '5 hours', NOW(), NOW()),
(gen_random_uuid(), 18, 3, 181800, 'GNF', 'MOMO-TXN-003', 'REUSSI',    NOW(),                    NOW(),                   NOW(), NOW());

-- ============================================================
-- 15. AVIS (Reviews)
-- ============================================================
INSERT INTO avis (avis_uuid, user_id, commande_id, vehicule_id, note, commentaire, reponse, date_reponse, visible, created_at, updated_at) VALUES
(gen_random_uuid(), 13, 11, 1, 5, 'Excellent voyage ! Bus confortable et climatisé. Chauffeur très professionnel.',                  'Merci pour votre confiance ! À bientôt.',                                    NOW()-INTERVAL '2 days', true, NOW()-INTERVAL '3 days', NOW()),
(gen_random_uuid(), 14, 12, 1, 4, 'Bon trajet, arrivée à l''heure. Bus propre.',                                                     NULL,                                                                          NULL,                    true, NOW()-INTERVAL '3 days', NOW()),
(gen_random_uuid(), 15, 13, 5, 5, 'Super bus Trans-Guinée Express ! Très confortable pour le long trajet vers Labé.',                 'Merci Mariama ! Nous vous attendons pour le prochain voyage.',                NOW()-INTERVAL '1 day',  true, NOW()-INTERVAL '2 days', NOW()),
(gen_random_uuid(), 16, 14, 4, 4, 'Très bon service, bus climatisé et départ ponctuel. Je recommande.',                               NULL,                                                                          NULL,                    true, NOW()-INTERVAL '1 day',  NOW()),
(gen_random_uuid(), 17, 15, 4, 3, 'Le voyage était long mais le bus était correct. Un arrêt de plus aurait été apprécié.',            'Nous prenons en compte votre suggestion. Merci.',                             NOW()-INTERVAL '12 hours', true, NOW()-INTERVAL '1 day', NOW()),
(gen_random_uuid(), 17, 16, 5, 2, 'Le bus est tombé en panne en route. Heureusement le remboursement a été rapide.',                  'Nous nous excusons pour ce désagrément. Le véhicule a été réparé.',           NOW()-INTERVAL '2 days', true, NOW()-INTERVAL '3 days', NOW());

-- ============================================================
-- 16. NOTIFICATIONS
-- ============================================================
INSERT INTO notifications (notification_uuid, user_id, type_notification, categorie, titre, message, lue, envoyee, date_envoi, reference_id, reference_type, created_at) VALUES
(gen_random_uuid(), 13, 'IN_APP', 'RESERVATION', 'Réservation confirmée',   'Votre réservation Conakry → Kindia le 18/02 à 06:00 est confirmée. 2 places.',     false, true, NOW()-INTERVAL '1 day', 1, 'COMMANDE', NOW()),
(gen_random_uuid(), 13, 'SMS',    'PAIEMENT',    'Paiement reçu',           'Paiement de 161 600 GNF reçu via Orange Money. Réf: OM-PAY-001',                    true,  true, NOW()-INTERVAL '1 day', 1, 'COMMANDE', NOW()),
(gen_random_uuid(), 14, 'IN_APP', 'RESERVATION', 'Réservation confirmée',   'Votre réservation Conakry → Kindia le 18/02 à 06:00 est confirmée.',                true,  true, NOW()-INTERVAL '2 days', 2, 'COMMANDE', NOW()),
(gen_random_uuid(), 15, 'IN_APP', 'RESERVATION', 'Réservation confirmée',   'Réservation Conakry → Mamou le 18/02 à 07:00 confirmée. 3 places.',                false, true, NOW()-INTERVAL '1 day', 3, 'COMMANDE', NOW()),
(gen_random_uuid(), 15, 'EMAIL',  'PAIEMENT',    'Confirmation paiement',   'Paiement de 409 050 GNF confirmé via MTN Mobile Money.',                            true,  true, NOW()-INTERVAL '1 day', 3, 'COMMANDE', NOW()),
(gen_random_uuid(), 16, 'IN_APP', 'RESERVATION', 'Réservation annulée',     'Votre réservation Conakry → Mamou a été annulée.',                                  true,  true, NOW()-INTERVAL '1 day', 10, 'COMMANDE', NOW()),
(gen_random_uuid(), 17, 'IN_APP', 'DEPART',      'Départ imminent',         'Votre bus Conakry → Kankan part demain à 05:30. Présentez-vous 30 min avant.',      false, true, NOW(), 5, 'COMMANDE', NOW()),
(gen_random_uuid(), 17, 'IN_APP', 'PAIEMENT',    'Remboursement effectué',  'Remboursement de 202 000 GNF effectué sur votre compte Orange Money.',               true,  true, NOW()-INTERVAL '3 days', 16, 'COMMANDE', NOW()),
(gen_random_uuid(), 10, 'IN_APP', 'RESERVATION', 'Nouvelle réservation',    'Nouvelle réservation de 2 places pour Conakry → Kindia du 18/02.',                  false, true, NOW()-INTERVAL '1 day', 1, 'COMMANDE', NOW()),
(gen_random_uuid(), 11, 'IN_APP', 'RESERVATION', 'Offre complète',          'Votre offre Mamou → Labé du 18/02 est complète ! 7/7 places réservées.',            false, true, NOW(), 13, 'OFFRE', NOW()),
(gen_random_uuid(), 13, 'IN_APP', 'PROMOTION',   'Offre spéciale',          'Profitez de -10% sur Conakry → Mamou avec Trans-Guinée Express ! Code: PROMO10',    false, true, NOW(), NULL, NULL, NOW()),
(gen_random_uuid(), 14, 'IN_APP', 'PROMOTION',   'Offre spéciale',          'Profitez de -10% sur Conakry → Mamou avec Trans-Guinée Express ! Code: PROMO10',    false, true, NOW(), NULL, NULL, NOW());

-- ============================================================
-- 17. PARTENAIRES
-- ============================================================
INSERT INTO partenaires (partenaire_uuid, localisation_id, nom, type_partenaire, raison_sociale, telephone, email, adresse, commission_pourcentage, commission_fixe, responsable_nom, responsable_telephone, statut, date_debut_partenariat, created_at, updated_at) VALUES
(gen_random_uuid(), 9,    'Crédit Rural de Guinée',    'MICROFINANCE', 'CRG SA',                          '+224 631 00 00 01', 'contact@crg-guinee.com',      'Kaloum, Conakry',   2.00, 500,  'Mamadou Cellou Diallo', '+224 631 00 00 02', 'ACTIF', '2025-01-01', NOW(), NOW()),
(gen_random_uuid(), NULL, 'Orange Money Guinée',       'COMMERCE',     'Orange Finances Mobiles Guinée',   '+224 632 00 00 01', 'partenariat@orangemoney.gn',  'Dixinn, Conakry',   1.00, 0,    'Aïcha Barry',          '+224 632 00 00 02', 'ACTIF', '2025-03-01', NOW(), NOW()),
(gen_random_uuid(), 10,   'Point Relais Nongo',        'POINT_VENTE',  'PRN SARL',                         '+224 633 00 00 01', 'prn@email.com',               'Nongo, Ratoma',     1.50, 200,  'Dr. Ibrahima Bah',     '+224 633 00 00 02', 'ACTIF', '2025-06-01', NOW(), NOW()),
(gen_random_uuid(), NULL, 'Agence Voyage Kankan',      'AGENCE',       'AVK SARL',                         '+224 634 00 00 01', 'avk@email.com',               'Centre, Kankan',    3.00, 1000, 'Sékou Konaté',         '+224 634 00 00 02', 'ACTIF', '2025-02-01', NOW(), NOW());

-- ============================================================
-- RESET SEQUENCES
-- ============================================================
SELECT setval('villes_ville_id_seq',        (SELECT COALESCE(MAX(ville_id), 1) FROM villes));
SELECT setval('communes_commune_id_seq',    (SELECT COALESCE(MAX(commune_id), 1) FROM communes));
SELECT setval('quartiers_quartier_id_seq',  (SELECT COALESCE(MAX(quartier_id), 1) FROM quartiers));
SELECT setval('localisations_localisation_id_seq', (SELECT COALESCE(MAX(localisation_id), 1) FROM localisations));
SELECT setval('sites_site_id_seq',          (SELECT COALESCE(MAX(site_id), 1) FROM sites));
SELECT setval('departs_depart_id_seq',      (SELECT COALESCE(MAX(depart_id), 1) FROM departs));
SELECT setval('arrivees_arrivee_id_seq',    (SELECT COALESCE(MAX(arrivee_id), 1) FROM arrivees));
SELECT setval('users_user_id_seq',          (SELECT COALESCE(MAX(user_id), 1) FROM users));
SELECT setval('vehicules_vehicule_id_seq',  (SELECT COALESCE(MAX(vehicule_id), 1) FROM vehicules));
SELECT setval('trajets_trajet_id_seq',      (SELECT COALESCE(MAX(trajet_id), 1) FROM trajets));
SELECT setval('offres_offre_id_seq',        (SELECT COALESCE(MAX(offre_id), 1) FROM offres));
SELECT setval('commandes_commande_id_seq',  (SELECT COALESCE(MAX(commande_id), 1) FROM commandes));

COMMIT;
