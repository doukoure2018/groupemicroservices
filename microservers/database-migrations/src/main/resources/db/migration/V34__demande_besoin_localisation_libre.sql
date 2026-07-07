-- ============================================================
-- V34 - Demande de besoin : commune/quartier en saisie libre
-- ============================================================
-- UX mobile (2026-07-07) : les champs commune et quartier deviennent des
-- auto-complétions avec saisie libre. Si la valeur tapée n'existe pas dans
-- le référentiel, on la conserve telle quelle (commune_texte/quartier_texte)
-- au lieu de bloquer l'utilisateur. Une demande sans commune_id connue est
-- diffusée à TOUTES les agences vérifiées (pas de zone résoluble).
-- ============================================================

ALTER TABLE immo_demande_besoin
    ALTER COLUMN commune_id DROP NOT NULL;

ALTER TABLE immo_demande_besoin
    ADD COLUMN IF NOT EXISTS commune_texte  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS quartier_texte VARCHAR(100);

-- Au moins une localisation exploitable (référentiel OU texte libre)
ALTER TABLE immo_demande_besoin DROP CONSTRAINT IF EXISTS ck_immo_demande_localisation;
ALTER TABLE immo_demande_besoin
    ADD CONSTRAINT ck_immo_demande_localisation
        CHECK (commune_id IS NOT NULL OR commune_texte IS NOT NULL);
