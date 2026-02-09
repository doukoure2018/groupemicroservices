package io.multi.billetterieservice.query;

/**
 * Classe utilitaire contenant toutes les requêtes SQL pour l'entité Trajet.
 * Inclut les jointures complètes vers Depart, Arrivee, Sites, Localisations et Users.
 */
public final class TrajetQuery {

    private TrajetQuery() {
        // Classe utilitaire - pas d'instanciation
    }

    // ========== SELECT DE BASE AVEC JOINTURES ==========

    private static final String BASE_SELECT = """
        SELECT 
            t.trajet_id,
            t.trajet_uuid,
            t.depart_id,
            t.arrivee_id,
            t.user_id,
            t.libelle_trajet,
            t.distance_km,
            t.duree_estimee_minutes,
            t.montant_base,
            t.montant_bagages,
            t.devise,
            t.description,
            t.instructions,
            t.actif,
            t.created_at,
            t.updated_at,
            -- Départ
            d.depart_uuid,
            d.libelle AS depart_libelle,
            d.site_id AS depart_site_id,
            sd.site_uuid AS depart_site_uuid,
            sd.nom AS depart_site_nom,
            ld.adresse_complete AS depart_adresse_complete,
            ld.latitude AS depart_latitude,
            ld.longitude AS depart_longitude,
            vd.ville_uuid AS depart_ville_uuid,
            vd.libelle AS depart_ville_libelle,
            rd.libelle AS depart_region_libelle,
            -- Arrivée
            a.arrivee_uuid,
            a.libelle AS arrivee_libelle,
            a.site_id AS arrivee_site_id,
            sa.site_uuid AS arrivee_site_uuid,
            sa.nom AS arrivee_site_nom,
            la.adresse_complete AS arrivee_adresse_complete,
            la.latitude AS arrivee_latitude,
            la.longitude AS arrivee_longitude,
            va.ville_uuid AS arrivee_ville_uuid,
            va.libelle AS arrivee_ville_libelle,
            ra.libelle AS arrivee_region_libelle,
            -- Utilisateur créateur
            u.user_uuid,
            u.username AS user_username,
            CONCAT(u.first_name, ' ', u.last_name) AS user_full_name
        FROM trajets t
        -- Jointures Départ
        INNER JOIN departs d ON t.depart_id = d.depart_id
        INNER JOIN sites sd ON d.site_id = sd.site_id
        INNER JOIN localisations ld ON sd.localisation_id = ld.localisation_id
        LEFT JOIN quartiers qd ON ld.quartier_id = qd.quartier_id
        LEFT JOIN communes cd ON qd.commune_id = cd.commune_id
        LEFT JOIN villes vd ON cd.ville_id = vd.ville_id
        LEFT JOIN regions rd ON vd.region_id = rd.region_id
        -- Jointures Arrivée
        INNER JOIN arrivees a ON t.arrivee_id = a.arrivee_id
        INNER JOIN sites sa ON a.site_id = sa.site_id
        INNER JOIN localisations la ON sa.localisation_id = la.localisation_id
        LEFT JOIN quartiers qa ON la.quartier_id = qa.quartier_id
        LEFT JOIN communes ca ON qa.commune_id = ca.commune_id
        LEFT JOIN villes va ON ca.ville_id = va.ville_id
        LEFT JOIN regions ra ON va.region_id = ra.region_id
        -- Jointure Utilisateur
        INNER JOIN users u ON t.user_id = u.user_id
        """;

    // ========== REQUÊTES DE LECTURE ==========

    public static final String FIND_ALL = BASE_SELECT + """
        ORDER BY t.created_at DESC
        """;

    public static final String FIND_ALL_ACTIFS = BASE_SELECT + """
        WHERE t.actif = TRUE
        ORDER BY t.libelle_trajet ASC
        """;

    public static final String FIND_BY_UUID = BASE_SELECT + """
        WHERE t.trajet_uuid = :uuid
        """;

    public static final String FIND_BY_ID = BASE_SELECT + """
        WHERE t.trajet_id = :id
        """;

    public static final String FIND_BY_DEPART = BASE_SELECT + """
        WHERE t.depart_id = :departId
        ORDER BY t.libelle_trajet ASC
        """;

    public static final String FIND_BY_DEPART_UUID = BASE_SELECT + """
        WHERE d.depart_uuid = :departUuid
        ORDER BY t.libelle_trajet ASC
        """;

    public static final String FIND_BY_ARRIVEE = BASE_SELECT + """
        WHERE t.arrivee_id = :arriveeId
        ORDER BY t.libelle_trajet ASC
        """;

    public static final String FIND_BY_ARRIVEE_UUID = BASE_SELECT + """
        WHERE a.arrivee_uuid = :arriveeUuid
        ORDER BY t.libelle_trajet ASC
        """;

    public static final String FIND_BY_DEPART_AND_ARRIVEE = BASE_SELECT + """
        WHERE d.depart_uuid = :departUuid 
          AND a.arrivee_uuid = :arriveeUuid
        """;

    public static final String FIND_BY_VILLE_DEPART = BASE_SELECT + """
        WHERE vd.ville_uuid = :villeUuid
        ORDER BY t.libelle_trajet ASC
        """;

    public static final String FIND_BY_VILLE_ARRIVEE = BASE_SELECT + """
        WHERE va.ville_uuid = :villeUuid
        ORDER BY t.libelle_trajet ASC
        """;

    public static final String FIND_BY_VILLES = BASE_SELECT + """
        WHERE vd.ville_uuid = :villeDepartUuid 
          AND va.ville_uuid = :villeArriveeUuid
        ORDER BY t.montant_base ASC
        """;

    public static final String FIND_BY_USER = BASE_SELECT + """
        WHERE t.user_id = :userId
        ORDER BY t.created_at DESC
        """;

    public static final String SEARCH_BY_LIBELLE = BASE_SELECT + """
        WHERE LOWER(t.libelle_trajet) LIKE :searchTerm
           OR LOWER(d.libelle) LIKE :searchTerm
           OR LOWER(a.libelle) LIKE :searchTerm
           OR LOWER(vd.libelle) LIKE :searchTerm
           OR LOWER(va.libelle) LIKE :searchTerm
        ORDER BY t.libelle_trajet ASC
        """;

    // ========== REQUÊTES DE VÉRIFICATION ==========

    public static final String EXISTS_BY_DEPART_AND_ARRIVEE = """
        SELECT COUNT(*) FROM trajets t
        INNER JOIN departs d ON t.depart_id = d.depart_id
        INNER JOIN arrivees a ON t.arrivee_id = a.arrivee_id
        WHERE d.depart_uuid = :departUuid 
          AND a.arrivee_uuid = :arriveeUuid
        """;

    public static final String EXISTS_BY_DEPART_AND_ARRIVEE_EXCLUDING_UUID = """
        SELECT COUNT(*) FROM trajets t
        INNER JOIN departs d ON t.depart_id = d.depart_id
        INNER JOIN arrivees a ON t.arrivee_id = a.arrivee_id
        WHERE d.depart_uuid = :departUuid
          AND a.arrivee_uuid = :arriveeUuid
          AND t.trajet_uuid != :excludeUuid
        """;

    // ========== REQUÊTES D'ÉCRITURE ==========

    public static final String INSERT = """
        INSERT INTO trajets (
            depart_id, arrivee_id, user_id, libelle_trajet, distance_km,
            duree_estimee_minutes, montant_base, montant_bagages, devise,
            description, instructions, actif
        ) VALUES (
            :departId, :arriveeId, :userId, :libelleTrajet, :distanceKm,
            :dureeEstimeeMinutes, :montantBase, :montantBagages, :devise,
            :description, :instructions, :actif
        )
        RETURNING trajet_id, trajet_uuid, created_at, updated_at
        """;

    public static final String UPDATE = """
        UPDATE trajets SET
            depart_id = :departId,
            arrivee_id = :arriveeId,
            libelle_trajet = :libelleTrajet,
            distance_km = :distanceKm,
            duree_estimee_minutes = :dureeEstimeeMinutes,
            montant_base = :montantBase,
            montant_bagages = :montantBagages,
            devise = :devise,
            description = :description,
            instructions = :instructions,
            actif = :actif
        WHERE trajet_uuid = :uuid
        RETURNING trajet_id, created_at, updated_at
        """;

    public static final String UPDATE_ACTIF = """
        UPDATE trajets SET actif = :actif
        WHERE trajet_uuid = :uuid
        """;

    public static final String UPDATE_MONTANTS = """
    UPDATE trajets SET
        montant_base = :montantBase,
        montant_bagages = :montantBagages
    WHERE trajet_uuid = :uuid
    """;

    public static final String DELETE_BY_UUID = """
        DELETE FROM trajets WHERE trajet_uuid = :uuid
        """;

    // ========== REQUÊTES DE COMPTAGE ==========

    public static final String COUNT_ALL = """
        SELECT COUNT(*) FROM trajets
        """;

    public static final String COUNT_ACTIFS = """
        SELECT COUNT(*) FROM trajets WHERE actif = TRUE
        """;

    public static final String COUNT_BY_DEPART = """
        SELECT COUNT(*) FROM trajets t
        INNER JOIN departs d ON t.depart_id = d.depart_id
        WHERE d.depart_uuid = :departUuid
        """;

    public static final String COUNT_BY_ARRIVEE = """
        SELECT COUNT(*) FROM trajets t
        INNER JOIN arrivees a ON t.arrivee_id = a.arrivee_id
        WHERE a.arrivee_uuid = :arriveeUuid
        """;

    // ========== VÉRIFICATION DES DÉPENDANCES ==========

    public static final String HAS_OFFRES = """
        SELECT COUNT(*) FROM offres o
        INNER JOIN trajets t ON o.trajet_id = t.trajet_id
        WHERE t.trajet_uuid = :uuid
        """;
}