package io.multi.billetterieservice.query;

public final class ScheduledNotificationQuery {

    private ScheduledNotificationQuery() {}

    public static final String FIND_OFFRES_AT_REMPLISSAGE = """
        SELECT o.offre_id, o.offre_uuid, o.niveau_remplissage, o.date_depart, o.heure_depart,
               vd.libelle AS ville_depart_libelle,
               va.libelle AS ville_arrivee_libelle
        FROM offres o
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
        WHERE o.statut IN ('OUVERT', 'COMPLET')
          AND o.niveau_remplissage >= :seuil
          AND o.date_depart >= CURRENT_DATE
        """;

    public static final String FIND_COMMANDES_BY_OFFRE_ID = """
        SELECT c.commande_id, c.user_id, c.numero_commande, c.nombre_places,
               STRING_AGG(DISTINCT b.code_billet, ', ') AS billet_codes,
               STRING_AGG(DISTINCT b.nom_passager, ', ') AS passager_noms,
               (SELECT b2.telephone_passager FROM billets b2
                WHERE b2.commande_id = c.commande_id AND b2.telephone_passager IS NOT NULL
                LIMIT 1) AS passager_phone
        FROM commandes c
        LEFT JOIN billets b ON b.commande_id = c.commande_id AND b.statut = 'VALIDE'
        WHERE c.offre_id = :offreId AND c.statut IN ('CONFIRMEE', 'PAYEE')
        GROUP BY c.commande_id, c.user_id, c.numero_commande, c.nombre_places
        """;

    public static final String FIND_OFFRES_DEPART_DEMAIN = """
        SELECT o.offre_id, o.offre_uuid, o.date_depart, o.heure_depart,
               o.point_rencontre,
               vd.libelle AS ville_depart_libelle,
               va.libelle AS ville_arrivee_libelle,
               sd.nom AS site_depart
        FROM offres o
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
        WHERE o.statut IN ('OUVERT', 'COMPLET')
          AND o.date_depart = CURRENT_DATE + INTERVAL '1 day'
        """;

    public static final String FIND_OFFRES_DEPART_PROCHE = """
        SELECT o.offre_id, o.offre_uuid, o.date_depart, o.heure_depart,
               o.point_rencontre,
               vd.libelle AS ville_depart_libelle,
               va.libelle AS ville_arrivee_libelle,
               sd.nom AS site_depart
        FROM offres o
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
        WHERE o.statut IN ('OUVERT', 'COMPLET')
          AND o.date_depart = CURRENT_DATE
          AND o.heure_depart BETWEEN LOCALTIME AND LOCALTIME + INTERVAL '2 hours'
        """;
}
