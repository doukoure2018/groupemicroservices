-- ============================================================
-- V31 - Onboarding des agences immobilières + validation conformité
-- ============================================================
-- Projet « gestion des utilisateurs / agences » (2026-07-05) :
--   1. Rôle ADMIN_IMMO        -> comptes « agence immobilière » (self-service à l'inscription)
--   2. Rôle ADMIN_CONFORMITE  -> back-office conformité (validation des agences)
--   3. Colonnes d'onboarding sur immo_agence + cycle de statut étendu.
--
-- Réutilisation de l'existant (V13) — PAS de nouvelles colonnes pour :
--   - RCCM / code NIF        -> numero_registre
--   - email professionnel    -> email
--   - contact pour joindre   -> telephone
--   - document RCCM uploadé  -> documents_kyc_url (MinIO)
--
-- Cycle de statut_verification :
--   PROFIL_INCOMPLET -> EN_VALIDATION -> VERIFIE | REJETE
--   (EN_ATTENTE conservé pour compat. des lignes existantes, équivalent
--    de PROFIL_INCOMPLET pour les agences créées avant V31.)
-- ============================================================

-- 1. Rôle ADMIN_IMMO (idempotent)
INSERT INTO roles (role_uuid, name, authority)
SELECT 'b3c1a7d2-4e5f-4a6b-8c9d-0e1f2a3b4c5d', 'ADMIN_IMMO',
       'user:read,user:update,immo:agence:manage,immo:demande:read'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ADMIN_IMMO');

-- 2. Rôle ADMIN_CONFORMITE (idempotent)
INSERT INTO roles (role_uuid, name, authority)
SELECT 'c4d2b8e3-5f60-4b7c-9dae-1f203b4c5d6e', 'ADMIN_CONFORMITE',
       'immo:conformite:read,immo:conformite:update,user:read'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ADMIN_CONFORMITE');

-- 3. Colonnes d'onboarding sur immo_agence
ALTER TABLE immo_agence
    ADD COLUMN IF NOT EXISTS adresse                     VARCHAR(255),
    ADD COLUMN IF NOT EXISTS commune_id                  BIGINT,
    ADD COLUMN IF NOT EXISTS region_id                   BIGINT,
    ADD COLUMN IF NOT EXISTS telephone_whatsapp          VARCHAR(20),
    ADD COLUMN IF NOT EXISTS motif_rejet                 TEXT,
    ADD COLUMN IF NOT EXISTS date_soumission_conformite  TIMESTAMP(6) WITH TIME ZONE;

-- FK vers le référentiel géographique billetterie (partagé, cf. V2)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_immo_agence_commune') THEN
        ALTER TABLE immo_agence
            ADD CONSTRAINT fk_immo_agence_commune FOREIGN KEY (commune_id)
                REFERENCES communes (commune_id) ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_immo_agence_region') THEN
        ALTER TABLE immo_agence
            ADD CONSTRAINT fk_immo_agence_region FOREIGN KEY (region_id)
                REFERENCES regions (region_id) ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Cycle de statut étendu
ALTER TABLE immo_agence DROP CONSTRAINT IF EXISTS ck_immo_agence_statut;
ALTER TABLE immo_agence
    ADD CONSTRAINT ck_immo_agence_statut CHECK (statut_verification IN
        ('PROFIL_INCOMPLET', 'EN_ATTENTE', 'EN_VALIDATION', 'VERIFIE', 'REJETE'));

-- 5. Index pour la file d'attente de la conformité
CREATE INDEX IF NOT EXISTS idx_immo_agence_soumission
    ON immo_agence (date_soumission_conformite)
    WHERE statut_verification = 'EN_VALIDATION';
