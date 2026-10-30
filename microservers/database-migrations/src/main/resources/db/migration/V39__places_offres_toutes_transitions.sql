-- =============================================================================
-- Places des offres : compter toutes les transitions de statut de commande
-- =============================================================================
-- Le déclencheur d'origine ne traitait que deux cas : l'insertion d'une commande
-- déjà CONFIRMEE ou PAYEE, et le passage à ANNULEE. Les trois autres transitions
-- étaient ignorées, ce qui devient bloquant avec le paiement en ligne, où une
-- commande naît EN_ATTENTE puis est confirmée après encaissement :
--
--   1. insertion EN_ATTENTE        -> aucune place retenue pendant le paiement,
--                                     donc surréservation possible à deux clients ;
--   2. EN_ATTENTE -> CONFIRMEE     -> aucune place décomptée, jamais ;
--   3. EN_ATTENTE -> ANNULEE       -> restitution de places jamais prises,
--                                     le compteur de disponibles enfle à chaque abandon.
--
-- Nouvelle règle, unique et symétrique : une commande occupe ses places dès
-- qu'elle existe et tant qu'elle n'est pas ANNULEE. Les places sont donc
-- retenues pendant le paiement et rendues s'il échoue.
--
-- Conséquence d'exploitation : un paiement abandonné immobilise des places
-- jusqu'à l'annulation de la commande. Une purge des commandes EN_ATTENTE
-- expirées devra accompagner la mise en service du paiement en ligne.
-- =============================================================================

CREATE OR REPLACE FUNCTION update_places_disponibles()
RETURNS TRIGGER AS $$
DECLARE
    v_offre_id BIGINT;
    v_delta    INTEGER := 0;  -- positif = places prises, négatif = places rendues
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_offre_id := NEW.offre_id;
        IF NEW.statut <> 'ANNULEE' THEN
            v_delta := NEW.nombre_places;
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        v_offre_id := NEW.offre_id;
        IF OLD.statut = 'ANNULEE' AND NEW.statut <> 'ANNULEE' THEN
            v_delta := NEW.nombre_places;                       -- réactivation
        ELSIF OLD.statut <> 'ANNULEE' AND NEW.statut = 'ANNULEE' THEN
            v_delta := -OLD.nombre_places;                      -- annulation
        ELSIF OLD.statut <> 'ANNULEE' AND NEW.statut <> 'ANNULEE' THEN
            v_delta := NEW.nombre_places - OLD.nombre_places;   -- changement de quantité
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        v_offre_id := OLD.offre_id;
        IF OLD.statut <> 'ANNULEE' THEN
            v_delta := -OLD.nombre_places;
        END IF;
    END IF;

    IF v_delta <> 0 THEN
        UPDATE offres
           SET nombre_places_reservees   = nombre_places_reservees + v_delta,
               nombre_places_disponibles = nombre_places_disponibles - v_delta,
               niveau_remplissage = CASE
                                      WHEN nombre_places_total > 0
                                      THEN ROUND(((nombre_places_reservees + v_delta)::NUMERIC
                                                  / nombre_places_total) * 100)
                                      ELSE 0
                                    END,
               statut = CASE
                          WHEN nombre_places_disponibles - v_delta <= 0 AND statut = 'OUVERT'  THEN 'COMPLET'
                          WHEN nombre_places_disponibles - v_delta >  0 AND statut = 'COMPLET' THEN 'OUVERT'
                          ELSE statut
                        END
         WHERE offre_id = v_offre_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- La suppression d'une commande rendait ses places définitivement perdues.
DROP TRIGGER IF EXISTS update_offre_places ON commandes;
CREATE TRIGGER update_offre_places
    AFTER INSERT OR UPDATE OR DELETE ON commandes
    FOR EACH ROW EXECUTE FUNCTION update_places_disponibles();

-- =============================================================================
-- Remise en cohérence des compteurs
-- =============================================================================
-- Les transitions ignorées ont pu faire dériver les compteurs. On les recalcule
-- depuis les commandes, seule source de vérité. Idempotent.
-- =============================================================================

UPDATE offres o
   SET nombre_places_reservees   = COALESCE(c.places, 0),
       nombre_places_disponibles = GREATEST(o.nombre_places_total - COALESCE(c.places, 0), 0),
       niveau_remplissage = CASE
                              WHEN o.nombre_places_total > 0
                              THEN ROUND((COALESCE(c.places, 0)::NUMERIC / o.nombre_places_total) * 100)
                              ELSE 0
                            END
  FROM (
        SELECT o2.offre_id,
               COALESCE(SUM(cm.nombre_places) FILTER (WHERE cm.statut <> 'ANNULEE'), 0) AS places
          FROM offres o2
          LEFT JOIN commandes cm ON cm.offre_id = o2.offre_id
         GROUP BY o2.offre_id
       ) c
 WHERE c.offre_id = o.offre_id;

-- Le statut suit les compteurs remis à plat, sans toucher aux offres annulées,
-- suspendues ou terminées.
UPDATE offres
   SET statut = CASE
                  WHEN nombre_places_disponibles <= 0 AND statut = 'OUVERT'  THEN 'COMPLET'
                  WHEN nombre_places_disponibles >  0 AND statut = 'COMPLET' THEN 'OUVERT'
                  ELSE statut
                END
 WHERE statut IN ('OUVERT', 'COMPLET');
