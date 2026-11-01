-- =============================================================================
-- V43 — Tarification par passager (adulte / enfant) et bagages
-- =============================================================================
-- Jusqu'ici une commande ne connaissait qu'un prix unitaire multiplié par un
-- nombre de places, et les frais de service étaient codés en dur côté serveur
-- sans jamais être affichés. Le processus de réservation distingue désormais
-- adultes et enfants (tarif enfant par liaison, surchargeable par offre),
-- facture les bagages supplémentaires (prix par liaison, surchargeable), et
-- garde sur la commande le détail qui a servi au devis présenté au client.
-- =============================================================================

-- Tarif enfant : par liaison, à défaut plein tarif.
ALTER TABLE trajets ADD COLUMN IF NOT EXISTS montant_enfant DECIMAL(15, 2);

-- L'offre peut surcharger le tarif enfant et la politique bagages de la liaison.
ALTER TABLE offres
    ADD COLUMN IF NOT EXISTS montant_enfant DECIMAL(15, 2),
    ADD COLUMN IF NOT EXISTS bagages_autorises BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS bagages_inclus_par_passager INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS montant_bagage_supplementaire DECIMAL(15, 2);

ALTER TABLE offres
    ADD CONSTRAINT chk_offres_bagages_inclus CHECK (bagages_inclus_par_passager >= 0);

-- Chaque billet sait pour qui il est émis et ce qu'il a coûté.
ALTER TABLE billets
    ADD COLUMN IF NOT EXISTS type_passager VARCHAR(10) NOT NULL DEFAULT 'ADULTE',
    ADD COLUMN IF NOT EXISTS date_naissance DATE,
    ADD COLUMN IF NOT EXISTS montant DECIMAL(15, 2);

ALTER TABLE billets
    ADD CONSTRAINT chk_billets_type_passager CHECK (type_passager IN ('ADULTE', 'ENFANT'));

-- La commande garde la composition du devis et le contact à prévenir.
-- nombre_places reste la somme adultes + enfants : c'est elle que lit le
-- déclencheur de places, inchangé.
ALTER TABLE commandes
    ADD COLUMN IF NOT EXISTS nombre_adultes INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS nombre_enfants INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS nombre_bagages INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS montant_bagages DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS contact_email VARCHAR(150),
    ADD COLUMN IF NOT EXISTS contact_telephone VARCHAR(20);

ALTER TABLE commandes
    ADD CONSTRAINT chk_commandes_composition CHECK (nombre_adultes >= 1 AND nombre_enfants >= 0 AND nombre_bagages >= 0);

-- Les commandes existantes ne comptaient que des adultes.
UPDATE commandes SET nombre_adultes = nombre_places WHERE nombre_adultes <> nombre_places;

UPDATE billets b
   SET montant = c.montant_unitaire
  FROM commandes c
 WHERE c.commande_id = b.commande_id AND b.montant IS NULL;
