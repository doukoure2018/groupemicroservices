package io.multi.immobilierservice.query;

public final class DemandeBesoinQuery {

    private DemandeBesoinQuery() {}

    /** SELECT enrichi (libellés référentiel + région via commune→ville).
     *  LEFT JOIN partout depuis V34 : la commune peut être une saisie libre. */
    private static final String SELECT_ENRICHI = """
            SELECT d.*,
                   COALESCE(c.libelle, d.commune_texte)  AS commune_libelle,
                   COALESCE(q.libelle, d.quartier_texte) AS quartier_libelle,
                   tb.libelle AS type_bien_libelle,
                   r.region_id AS region_id_enrichi,
                   r.libelle  AS region_libelle
            FROM immo_demande_besoin d
            LEFT JOIN communes c   ON c.commune_id = d.commune_id
            LEFT JOIN villes v     ON v.ville_id = c.ville_id
            LEFT JOIN regions r    ON r.region_id = v.region_id
            LEFT JOIN quartiers q  ON q.quartier_id = d.quartier_id
            LEFT JOIN immo_type_bien tb ON tb.type_bien_id = d.type_bien_id
            """;

    public static final String INSERT_DEMANDE = """
            INSERT INTO immo_demande_besoin (
                user_id, type_annonce, type_bien_id, commune_id, commune_texte,
                quartier_id, quartier_texte,
                budget_min, budget_max, devise, nb_chambres_min, commodite_ids,
                description, contact_telephone, contact_whatsapp
            ) VALUES (
                :userId, :typeAnnonce, :typeBienId, :communeId, :communeTexte,
                :quartierId, :quartierTexte,
                :budgetMin, :budgetMax, COALESCE(:devise, 'GNF'), :nbChambresMin, CAST(:commoditeIdsJson AS JSONB),
                :description, :contactTelephone, :contactWhatsapp
            )
            RETURNING *
            """;

    public static final String FIND_BY_UUID = SELECT_ENRICHI + """
            WHERE d.demande_uuid = :demandeUuid
            """;

    public static final String FIND_MES_DEMANDES = SELECT_ENRICHI + """
            WHERE d.user_id = :userId
            ORDER BY d.created_at DESC
            """;

    /** Demandes actives de la zone d'une agence : même commune OU même région. */
    public static final String FIND_ACTIVES_ZONE = SELECT_ENRICHI + """
            WHERE d.statut = 'ACTIVE'
              AND (d.commune_id = :communeId OR r.region_id = :regionId)
            ORDER BY d.created_at DESC
            LIMIT :limit OFFSET :offset
            """;

    public static final String COUNT_ACTIVES_ZONE = """
            SELECT COUNT(*)
            FROM immo_demande_besoin d
            LEFT JOIN communes c ON c.commune_id = d.commune_id
            LEFT JOIN villes v ON v.ville_id = c.ville_id
            WHERE d.statut = 'ACTIVE'
              AND (d.commune_id = :communeId OR v.region_id = :regionId)
            """;

    public static final String FIND_ACTIVES_ALL = SELECT_ENRICHI + """
            WHERE d.statut = 'ACTIVE'
            ORDER BY d.created_at DESC
            LIMIT :limit OFFSET :offset
            """;

    public static final String COUNT_ACTIVES_ALL = """
            SELECT COUNT(*) FROM immo_demande_besoin WHERE statut = 'ACTIVE'
            """;

    public static final String UPDATE_STATUT = """
            UPDATE immo_demande_besoin SET
                statut = :statut,
                updated_at = CURRENT_TIMESTAMP
            WHERE demande_uuid = :demandeUuid
            RETURNING *
            """;
}
