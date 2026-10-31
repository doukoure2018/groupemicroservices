-- Deux défauts de concurrence sur les commandes, invisibles à faible trafic.
--
-- 1. Le numéro de commande était calculé « MAX du jour + 1 » sans verrou. Deux
--    commandes simultanées lisaient le même maximum, fabriquaient le même
--    numéro, et la seconde échouait sur la contrainte d'unicité : une vente
--    perdue au moment précis où il y en a le plus.
--
--    Un compteur par jour dans une table aurait gardé la numérotation
--    quotidienne, mais au prix d'un verrou de ligne tenu jusqu'au COMMIT —
--    donc pendant l'appel HTTP au prestataire de paiement, qui a lieu dans la
--    même transaction. Toutes les réservations se seraient mises en file
--    derrière le prestataire le plus lent. Une séquence, elle, ne verrouille
--    rien et ne revient jamais en arrière.
--
--    Le suffixe cesse d'être « n-ième commande du jour » pour devenir un
--    compteur global. La date reste en clair dans le numéro, qui demeure donc
--    lisible et triable. Six chiffres au lieu de quatre : aucun nouveau numéro
--    ne peut égaler un ancien, le remplissage à six positions l'interdit.
--
-- 2. La référence de paiement ne portait que 8 caractères d'un UUID, soit
--    32 bits. Le paradoxe des anniversaires donne déjà une collision probable
--    vers quelques dizaines de milliers de commandes — et la confirmation lit
--    cette référence en attendant une ligne unique. L'index la protège
--    désormais, et la génération passe à l'UUID complet côté service.

CREATE SEQUENCE IF NOT EXISTS seq_numero_commande START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION generate_numero_commande()
RETURNS TRIGGER AS $$
BEGIN
    -- nextval() est hors transaction : ni attente, ni doublon, même si la
    -- commande est finalement annulée (un numéro sauté est sans conséquence).
    NEW.numero_commande := 'CMD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-'
                           || LPAD(NEXTVAL('seq_numero_commande')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Référence de paiement unique. Index partiel : les commandes historiques sans
-- référence, s'il en existe, ne doivent pas bloquer la migration.
CREATE UNIQUE INDEX IF NOT EXISTS uq_commandes_reference_paiement
    ON commandes (reference_paiement)
    WHERE reference_paiement IS NOT NULL;
