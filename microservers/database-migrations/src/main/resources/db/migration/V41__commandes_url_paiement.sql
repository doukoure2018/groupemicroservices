-- Mémorise le lien de paiement renvoyé par le prestataire.
--
-- Sans lui, un client qui ferme l'onglet par accident n'a plus aucun moyen de
-- finir de payer : sa commande reste en attente jusqu'à la purge, et il doit
-- tout ressaisir. En le conservant, « Mes voyages » peut lui proposer de
-- reprendre là où il s'est arrêté, tant que le lien du prestataire vit.
--
-- 500 caractères : les liens de paiement portent souvent un jeton long en
-- paramètre de requête.
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS url_paiement VARCHAR(500);

COMMENT ON COLUMN commandes.url_paiement IS
    'Lien de paiement du prestataire, pour reprendre un règlement interrompu. Nul hors ligne.';
