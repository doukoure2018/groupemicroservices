-- =============================================================================
-- V18 : Contrainte anti-spam sur les visites (Phase 10b)
-- =============================================================================
-- Empêche un user de planifier N visites en parallèle sur la même propriété
-- (spam vendeur). Index UNIQUE PARTIEL : la contrainte ne s'applique qu'aux
-- visites "actives" — un user peut re-demander après annulation/effectuée.
--
-- Postgres garantit l'unicité même sur double-clic concurrent → pas besoin
-- de check applicatif (le service catch l'exception et retourne 409/400).
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS uq_immo_visite_active
ON immo_visite (visiteur_user_id, propriete_id)
WHERE statut IN ('DEMANDEE', 'CONFIRMEE');
