-- Conserve l'identifiant que le prestataire attribue à la transaction.
--
-- Jusqu'ici la vérification d'un paiement se faisait avec NOTRE référence, ce
-- qui suffisait à CinetPay, dont l'identifiant de transaction est celui qu'on
-- lui donne. Chap Chap Pay fonctionne autrement : il rend un operation_id qui
-- lui est propre, et c'est le seul moyen de l'interroger ensuite. Sans cette
-- colonne, une commande partie en paiement ne serait plus jamais vérifiable :
-- ni la page de retour, ni la purge des commandes abandonnées ne pourraient
-- trancher son sort.
--
-- Sa notification entrante porte d'ailleurs cet identifiant et non le nôtre,
-- d'où l'index : il sert à retrouver la commande depuis la notification, et
-- interdit qu'un même identifiant soit rattaché à deux paiements.
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS reference_prestataire VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS uq_paiements_reference_prestataire
    ON paiements (reference_prestataire)
    WHERE reference_prestataire IS NOT NULL;

COMMENT ON COLUMN paiements.reference_prestataire IS
    'Identifiant de transaction attribué par le prestataire. Nul pour un règlement hors ligne.';
