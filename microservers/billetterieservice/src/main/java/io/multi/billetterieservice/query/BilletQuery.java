package io.multi.billetterieservice.query;

public final class BilletQuery {

    private BilletQuery() {}

    public static final String FIND_BY_CODE_BILLET = """
        SELECT b.billet_id, b.billet_uuid, b.commande_id, b.code_billet, b.numero_siege,
               b.nom_passager, b.telephone_passager, b.piece_identite, b.statut,
               b.date_validation, b.valide_par, b.qr_code_data, b.created_at, b.updated_at,
               c.numero_commande, c.offre_id, c.user_id,
               o.date_depart, o.heure_depart,
               vd.libelle AS ville_depart_libelle,
               va.libelle AS ville_arrivee_libelle
        FROM billets b
        INNER JOIN commandes c ON b.commande_id = c.commande_id
        INNER JOIN offres o ON c.offre_id = o.offre_id
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
        WHERE b.code_billet = :codeBillet
        """;

    public static final String VALIDATE_BILLET = """
        UPDATE billets SET statut = 'UTILISE', date_validation = CURRENT_TIMESTAMP,
               valide_par = :validePar, updated_at = CURRENT_TIMESTAMP
        WHERE billet_id = :billetId AND statut = 'VALIDE'
        """;
}
