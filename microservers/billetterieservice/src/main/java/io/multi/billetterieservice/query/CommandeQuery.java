package io.multi.billetterieservice.query;

public final class CommandeQuery {

    private CommandeQuery() {}

    public static final String FIND_MODE_REGLEMENT_BY_CODE = """
        SELECT mode_reglement_id, mode_reglement_uuid, libelle, code,
               frais_pourcentage, frais_fixe, actif
        FROM modes_reglement
        WHERE code = :code AND actif = true
        """;

    public static final String INSERT_COMMANDE = """
        INSERT INTO commandes (offre_id, user_id, mode_reglement_id, nombre_places,
                               montant_unitaire, montant_total, montant_frais, montant_paye,
                               devise, statut, date_confirmation, date_paiement, reference_paiement)
        VALUES (:offreId, :userId, :modeReglementId, :nombrePlaces,
                :montantUnitaire, :montantTotal, :montantFrais, :montantPaye,
                :devise, :statut, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, :referencePaiement)
        RETURNING commande_id, commande_uuid, numero_commande, created_at
        """;

    public static final String INSERT_BILLET = """
        INSERT INTO billets (commande_id, nom_passager, telephone_passager, piece_identite)
        VALUES (:commandeId, :nomPassager, :telephonePassager, :pieceIdentite)
        RETURNING billet_id, billet_uuid, code_billet, statut, created_at
        """;

    public static final String INSERT_PAIEMENT = """
        INSERT INTO paiements (commande_id, mode_reglement_id, montant, devise,
                               reference_externe, statut, date_confirmation)
        VALUES (:commandeId, :modeReglementId, :montant, :devise,
                :referenceExterne, :statut, CURRENT_TIMESTAMP)
        RETURNING paiement_id, paiement_uuid, created_at
        """;

    public static final String FIND_COMMANDE_BY_UUID = """
        SELECT c.commande_id, c.commande_uuid, c.numero_commande, c.offre_id, c.user_id,
               c.mode_reglement_id, c.nombre_places, c.montant_unitaire, c.montant_total,
               c.montant_frais, c.montant_remise, c.montant_paye, c.devise, c.statut,
               c.date_reservation, c.date_confirmation, c.date_paiement,
               c.reference_paiement, c.notes, c.created_at, c.updated_at,
               o.offre_uuid, o.date_depart, o.heure_depart,
               o.niveau_remplissage, o.point_rencontre AS point_rendez_vous,
               vd.libelle AS ville_depart_libelle,
               va.libelle AS ville_arrivee_libelle,
               sd.nom AS site_depart,
               sa.nom AS site_arrivee,
               v.immatriculation AS vehicule_immatriculation,
               v.nom_chauffeur, v.contact_chauffeur,
               tv.libelle AS type_vehicule
        FROM commandes c
        INNER JOIN offres o ON c.offre_id = o.offre_id
        INNER JOIN vehicules v ON o.vehicule_id = v.vehicule_id
        LEFT JOIN types_vehicules tv ON v.type_vehicule_id = tv.type_vehicule_id
        INNER JOIN trajets t ON o.trajet_id = t.trajet_id
        INNER JOIN departs dep ON t.depart_id = dep.depart_id
        INNER JOIN sites sd ON dep.site_id = sd.site_id
        INNER JOIN localisations ld ON sd.localisation_id = ld.localisation_id
        LEFT JOIN quartiers qd ON ld.quartier_id = qd.quartier_id
        LEFT JOIN communes cd ON qd.commune_id = cd.commune_id
        LEFT JOIN villes vd ON cd.ville_id = vd.ville_id
        INNER JOIN arrivees arr ON t.arrivee_id = arr.arrivee_id
        INNER JOIN sites sa ON arr.site_id = sa.site_id
        INNER JOIN localisations la ON sa.localisation_id = la.localisation_id
        LEFT JOIN quartiers qa ON la.quartier_id = qa.quartier_id
        LEFT JOIN communes ca ON qa.commune_id = ca.commune_id
        LEFT JOIN villes va ON ca.ville_id = va.ville_id
        WHERE c.commande_uuid = :commandeUuid
        """;

    public static final String FIND_COMMANDES_BY_USER_ID = """
        SELECT c.commande_id, c.commande_uuid, c.numero_commande, c.offre_id, c.user_id,
               c.mode_reglement_id, c.nombre_places, c.montant_unitaire, c.montant_total,
               c.montant_frais, c.montant_remise, c.montant_paye, c.devise, c.statut,
               c.date_reservation, c.date_confirmation, c.date_paiement,
               c.reference_paiement, c.notes, c.created_at, c.updated_at,
               o.offre_uuid, o.date_depart, o.heure_depart,
               o.niveau_remplissage, o.point_rencontre AS point_rendez_vous,
               vd.libelle AS ville_depart_libelle,
               va.libelle AS ville_arrivee_libelle,
               sd.nom AS site_depart,
               sa.nom AS site_arrivee,
               v.immatriculation AS vehicule_immatriculation,
               v.nom_chauffeur, v.contact_chauffeur,
               tv.libelle AS type_vehicule
        FROM commandes c
        INNER JOIN offres o ON c.offre_id = o.offre_id
        INNER JOIN vehicules v ON o.vehicule_id = v.vehicule_id
        LEFT JOIN types_vehicules tv ON v.type_vehicule_id = tv.type_vehicule_id
        INNER JOIN trajets t ON o.trajet_id = t.trajet_id
        INNER JOIN departs dep ON t.depart_id = dep.depart_id
        INNER JOIN sites sd ON dep.site_id = sd.site_id
        INNER JOIN localisations ld ON sd.localisation_id = ld.localisation_id
        LEFT JOIN quartiers qd ON ld.quartier_id = qd.quartier_id
        LEFT JOIN communes cd ON qd.commune_id = cd.commune_id
        LEFT JOIN villes vd ON cd.ville_id = vd.ville_id
        INNER JOIN arrivees arr ON t.arrivee_id = arr.arrivee_id
        INNER JOIN sites sa ON arr.site_id = sa.site_id
        INNER JOIN localisations la ON sa.localisation_id = la.localisation_id
        LEFT JOIN quartiers qa ON la.quartier_id = qa.quartier_id
        LEFT JOIN communes ca ON qa.commune_id = ca.commune_id
        LEFT JOIN villes va ON ca.ville_id = va.ville_id
        WHERE c.user_id = :userId
        ORDER BY o.date_depart DESC, c.created_at DESC
        """;

    public static final String ANNULER_COMMANDE = """
        UPDATE commandes SET statut = 'ANNULEE', updated_at = CURRENT_TIMESTAMP
        WHERE commande_uuid = :commandeUuid AND user_id = :userId AND statut IN ('CONFIRMEE', 'PAYEE', 'EN_ATTENTE')
        """;

    public static final String ANNULER_BILLETS_BY_COMMANDE = """
        UPDATE billets SET statut = 'ANNULE', updated_at = CURRENT_TIMESTAMP
        WHERE commande_id = :commandeId
        """;

    public static final String FIND_BILLETS_BY_COMMANDE_ID = """
        SELECT billet_id, billet_uuid, commande_id, code_billet, numero_siege,
               nom_passager, telephone_passager, piece_identite, statut,
               date_validation, valide_par, qr_code_data, created_at, updated_at
        FROM billets
        WHERE commande_id = :commandeId
        ORDER BY billet_id ASC
        """;
}
