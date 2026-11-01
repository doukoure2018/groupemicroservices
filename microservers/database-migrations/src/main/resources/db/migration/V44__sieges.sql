-- =============================================================================
-- V44 — Sièges : gabarit de plan par type de véhicule, plan propre à un
-- véhicule, et un siège par billet, unique par offre
-- =============================================================================
-- Le plan de sièges se génère côté serveur à partir du gabarit du type de
-- véhicule et du nombre de places ; un véhicule peut porter son propre plan
-- (JSON, même forme que le plan généré). Chaque billet connaît son offre et
-- son siège ; l'index unique partiel est le verrou : deux voyageurs qui
-- choisissent le même siège au même instant, le second est refusé. Un billet
-- annulé libère son siège.
-- =============================================================================

ALTER TABLE types_vehicules ADD COLUMN IF NOT EXISTS gabarit VARCHAR(10) NOT NULL DEFAULT 'BUS';
ALTER TABLE types_vehicules ADD CONSTRAINT chk_types_vehicules_gabarit CHECK (gabarit IN ('BUS', 'MINIBUS', 'VOITURE'));
UPDATE types_vehicules SET gabarit = 'MINIBUS' WHERE libelle ILIKE 'minibus%';
UPDATE types_vehicules SET gabarit = 'VOITURE'
 WHERE libelle ILIKE 'taxi%' OR libelle ILIKE '%4x4%' OR libelle ILIKE 'voiture%' OR libelle ILIKE 'berline%' OR libelle ILIKE 'break%';

ALTER TABLE vehicules ADD COLUMN IF NOT EXISTS plan_sieges JSONB;

ALTER TABLE billets ADD COLUMN IF NOT EXISTS offre_id BIGINT;
UPDATE billets b SET offre_id = c.offre_id FROM commandes c WHERE c.commande_id = b.commande_id AND b.offre_id IS NULL;
ALTER TABLE billets ALTER COLUMN offre_id SET NOT NULL;
ALTER TABLE billets ADD CONSTRAINT fk_billets_offre FOREIGN KEY (offre_id)
    REFERENCES offres (offre_id) ON UPDATE CASCADE ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_billets_offre ON billets (offre_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_billets_siege_par_offre
    ON billets (offre_id, numero_siege)
    WHERE numero_siege IS NOT NULL AND statut <> 'ANNULE';
