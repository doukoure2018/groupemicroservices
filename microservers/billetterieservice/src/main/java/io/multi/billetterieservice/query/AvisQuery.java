package io.multi.billetterieservice.query;

/**
 * Classe utilitaire contenant les requetes SQL pour l'entite Avis.
 */
public final class AvisQuery {

    private AvisQuery() {
    }

    private static final String BASE_SELECT = """
        SELECT
            a.avis_id,
            a.avis_uuid,
            a.user_id,
            a.commande_id,
            a.vehicule_id,
            a.note,
            a.commentaire,
            a.reponse,
            a.date_reponse,
            a.visible,
            a.created_at,
            a.updated_at,
            CONCAT(u.first_name, ' ', u.last_name) AS user_full_name
        FROM avis a
        JOIN users u ON u.user_id = a.user_id
        """;

    /**
     * Avis visibles pour le vehicule lie a une offre (par offre_uuid).
     */
    public static final String FIND_BY_OFFRE_UUID = BASE_SELECT + """
        WHERE a.vehicule_id = (SELECT o.vehicule_id FROM offres o WHERE o.offre_uuid = :offreUuid)
          AND a.visible = true
        ORDER BY a.created_at DESC
        """;

    /**
     * Avis visibles pour un vehicule donne.
     */
    public static final String FIND_BY_VEHICULE_ID = BASE_SELECT + """
        WHERE a.vehicule_id = :vehiculeId
          AND a.visible = true
        ORDER BY a.created_at DESC
        """;

    /**
     * Note moyenne et nombre d'avis pour le vehicule d'une offre.
     */
    public static final String STATS_BY_OFFRE_UUID = """
        SELECT
            COALESCE(ROUND(AVG(a.note)::NUMERIC, 2), 0) AS note_moyenne,
            COUNT(*) AS nombre_avis
        FROM avis a
        WHERE a.vehicule_id = (SELECT o.vehicule_id FROM offres o WHERE o.offre_uuid = :offreUuid)
          AND a.visible = true
        """;
}
