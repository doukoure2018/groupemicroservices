-- =============================================================================
-- V17 : Compteur nombre_contacts (Phase 10a)
-- =============================================================================
-- ASYMÉTRIE INTENTIONNELLE : INSERT seulement, pas de DELETE.
--
-- Pourquoi : nombre_contacts mesure l'ACTIVITÉ HISTORIQUE COMMERCIALE d'un bien
-- (combien de prospects il a généré), pas le nombre de contacts actifs en boîte
-- de réception. Un vendeur qui archive 10 demandes traitées doit toujours voir
-- "30 contacts reçus" comme indicateur d'intérêt. C'est aligné avec les
-- marketplaces grand public (eBay, LeBonCoin "X messages reçus").
--
-- Conséquence : si on supprime physiquement un immo_contact (RGPD ?),
-- le compteur ne se met PAS à jour. Acceptable car cas rare ; à reposer
-- explicitement si scénario de purge en masse.
-- =============================================================================

CREATE OR REPLACE FUNCTION sync_immo_nombre_contacts()
RETURNS TRIGGER AS $$
BEGIN
    -- Pas de branche DELETE volontaire (cf. en-tête).
    IF TG_OP = 'INSERT' THEN
        UPDATE immo_propriete
        SET nombre_contacts = nombre_contacts + 1
        WHERE propriete_id = NEW.propriete_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_immo_contact_count
AFTER INSERT ON immo_contact
FOR EACH ROW
EXECUTE FUNCTION sync_immo_nombre_contacts();
