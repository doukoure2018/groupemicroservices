-- =============================================================================
-- V16 : Idempotence du job d'expiration (Phase 9b)
-- =============================================================================
-- Empêche un double envoi du rappel J-7 :
--   - Si le service redémarre pendant l'exécution du job (02:00)
--   - Si on scale à 2 instances en parallèle
--
-- Le job fait une UPDATE atomique qui pose `rappel_expiration_envoye_at`
-- en condition WHERE NULL. Une seule instance gagne la ligne ; les autres
-- voient 0 row affected et n'envoient rien.
-- =============================================================================

ALTER TABLE immo_propriete
    ADD COLUMN IF NOT EXISTS rappel_expiration_envoye_at TIMESTAMP(6) WITH TIME ZONE;

-- Index partiel : la requête du job filtre sur cette colonne IS NULL +
-- date_expiration dans une fenêtre. L'index ne contient que les lignes utiles.
CREATE INDEX IF NOT EXISTS idx_immo_propriete_rappel_pending
    ON immo_propriete (date_expiration)
    WHERE statut = 'PUBLIE' AND rappel_expiration_envoye_at IS NULL;
