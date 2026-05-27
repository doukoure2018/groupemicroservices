-- =============================================================================
-- Cleanup de tous les artefacts de test (users + données associées)
-- =============================================================================
-- À jouer pour ramener la BD à un état propre après les phases de tests.
--
-- Pré-requis : FK ON DELETE CASCADE en place (cf. V13) → la suppression d'un
-- user supprime ses profils, ses propriétés (+ photos MinIO orphelines !),
-- ses brouillons, ses favoris, ses invitations.
--
-- ATTENTION : ne supprime PAS les fichiers MinIO. Pour purger les buckets :
--   docker run --rm --network groupemicroservices_billetterie-network \
--     minio/mc:latest sh -c 'mc alias set local http://minio:9000 \
--     minioadmin minioadmin && mc rm --recursive --force local/immo-photos'
--
-- Exécution :
--   docker compose exec -T postgresdb psql -U inno2711 -d innodb \
--     < docs/cleanup-test-users.sql
-- =============================================================================

\set ON_ERROR_STOP on

BEGIN;

-- Compte avant
\echo ''
\echo '=== État AVANT cleanup ==='
SELECT 'users de test' AS table_name, COUNT(*) AS nb
  FROM users WHERE email LIKE '%@test.local'
UNION ALL SELECT 'propriétés [SEED]', COUNT(*) FROM immo_propriete WHERE titre LIKE '[SEED]%'
UNION ALL SELECT 'propriétés smoke/test', COUNT(*) FROM immo_propriete
   WHERE titre ILIKE '%smoke%' OR titre ILIKE '%test%' OR titre LIKE 'Pour rejet%' OR titre LIKE 'Bookmark%'
UNION ALL SELECT 'profils immo de test users', COUNT(*) FROM immo_profil
   WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%@test.local')
UNION ALL SELECT 'agences de test users', COUNT(*) FROM immo_agence
   WHERE proprietaire_user_id IN (SELECT user_id FROM users WHERE email LIKE '%@test.local')
UNION ALL SELECT 'invitations de test', COUNT(*) FROM immo_agence_invitation
   WHERE invite_par_user_id IN (SELECT user_id FROM users WHERE email LIKE '%@test.local')
      OR invite_user_id   IN (SELECT user_id FROM users WHERE email LIKE '%@test.local')
UNION ALL SELECT 'brouillons de test', COUNT(*) FROM immo_brouillon
   WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%@test.local');

-- Suppression : grâce aux FK CASCADE, supprimer les users supprime en cascade :
--   - immo_profil (CASCADE) → immo_propriete (RESTRICT — bloqué si profil avec annonces)
--   - immo_brouillon (CASCADE), immo_favori (CASCADE), immo_contact (CASCADE),
--     immo_visite (CASCADE), immo_signalement (CASCADE), immo_avis (CASCADE),
--     immo_agence (RESTRICT sur proprietaire_user_id), immo_agence_invitation (CASCADE)
--
-- Donc on supprime d'abord manuellement les propriétés (RESTRICT), puis users.

-- Étape 1 : propriétés des users de test (toute statut, [SEED] inclus)
DELETE FROM immo_propriete
WHERE profil_id IN (
    SELECT profil_id FROM immo_profil
    WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%@test.local')
);

-- Étape 2 : aussi nettoyer les propriétés [SEED] résiduelles (au cas où le profil
-- a été manuellement supprimé)
DELETE FROM immo_propriete WHERE titre LIKE '[SEED]%';

-- Étape 3 : agences de test (RESTRICT sur proprietaire — supprimer manuellement)
DELETE FROM immo_agence
WHERE proprietaire_user_id IN (SELECT user_id FROM users WHERE email LIKE '%@test.local');

-- Étape 4 : users (cascade sur profils, brouillons, favoris, contacts, visites, etc.)
DELETE FROM users WHERE email LIKE '%@test.local';

-- Compte après
\echo ''
\echo '=== État APRÈS cleanup ==='
SELECT 'users de test restants'    AS table_name, COUNT(*) AS nb FROM users WHERE email LIKE '%@test.local'
UNION ALL SELECT 'propriétés [SEED] restantes', COUNT(*) FROM immo_propriete WHERE titre LIKE '[SEED]%'
UNION ALL SELECT 'propriétés totales', COUNT(*) FROM immo_propriete;

COMMIT;

\echo ''
\echo '✓ Cleanup terminé. Pense à purger MinIO si tu veux libérer les photos orphelines :'
\echo '   docker run --rm --network groupemicroservices_billetterie-network minio/mc:latest \'
\echo '     sh -c "mc alias set local http://minio:9000 minioadmin minioadmin && \'
\echo '            mc rm --recursive --force local/immo-photos && \'
\echo '            mc rm --recursive --force local/immo-photos-thumbnails"'
