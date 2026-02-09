package io.multi.billetterieservice.query;

/**
 * Classe utilitaire contenant toutes les requêtes SQL pour l'entité TypeVehicule.
 */
public final class TypeVehiculeQuery {

    private TypeVehiculeQuery() {
        // Classe utilitaire - pas d'instanciation
    }

    // ========== SELECT DE BASE ==========

    private static final String BASE_SELECT = """
        SELECT 
            type_vehicule_id,
            type_vehicule_uuid,
            libelle,
            description,
            capacite_min,
            capacite_max,
            actif,
            created_at,
            updated_at
        FROM types_vehicules
        """;

    // ========== REQUÊTES DE LECTURE ==========

    public static final String FIND_ALL = BASE_SELECT + """
        ORDER BY libelle ASC
        """;

    public static final String FIND_ALL_ACTIFS = BASE_SELECT + """
        WHERE actif = TRUE
        ORDER BY libelle ASC
        """;

    public static final String FIND_BY_UUID = BASE_SELECT + """
        WHERE type_vehicule_uuid = :uuid
        """;

    public static final String FIND_BY_ID = BASE_SELECT + """
        WHERE type_vehicule_id = :id
        """;

    public static final String FIND_BY_LIBELLE = BASE_SELECT + """
        WHERE LOWER(libelle) = LOWER(:libelle)
        """;

    public static final String SEARCH_BY_LIBELLE = BASE_SELECT + """
        WHERE LOWER(libelle) LIKE :searchTerm
        ORDER BY libelle ASC
        """;

    public static final String FIND_BY_CAPACITE = BASE_SELECT + """
        WHERE actif = TRUE
          AND (capacite_min IS NULL OR capacite_min <= :capacite)
          AND (capacite_max IS NULL OR capacite_max >= :capacite)
        ORDER BY libelle ASC
        """;

    // ========== REQUÊTES DE VÉRIFICATION ==========

    public static final String EXISTS_BY_LIBELLE = """
        SELECT COUNT(*) FROM types_vehicules
        WHERE LOWER(libelle) = LOWER(:libelle)
        """;

    public static final String EXISTS_BY_LIBELLE_EXCLUDING_UUID = """
        SELECT COUNT(*) FROM types_vehicules
        WHERE LOWER(libelle) = LOWER(:libelle)
          AND type_vehicule_uuid != :excludeUuid
        """;

    public static final String HAS_VEHICULES = """
        SELECT COUNT(*) FROM vehicules
        WHERE type_vehicule_id = (
            SELECT type_vehicule_id FROM types_vehicules WHERE type_vehicule_uuid = :uuid
        )
        """;

    // ========== REQUÊTES D'ÉCRITURE ==========

    public static final String INSERT = """
        INSERT INTO types_vehicules (
            libelle, description, capacite_min, capacite_max, actif
        ) VALUES (
            :libelle, :description, :capaciteMin, :capaciteMax, :actif
        )
        RETURNING type_vehicule_id, type_vehicule_uuid, created_at, updated_at
        """;

    public static final String UPDATE = """
        UPDATE types_vehicules SET
            libelle = :libelle,
            description = :description,
            capacite_min = :capaciteMin,
            capacite_max = :capaciteMax,
            actif = :actif
        WHERE type_vehicule_uuid = :uuid
        RETURNING type_vehicule_id, created_at, updated_at
        """;

    public static final String UPDATE_ACTIF = """
        UPDATE types_vehicules SET actif = :actif
        WHERE type_vehicule_uuid = :uuid
        """;

    public static final String DELETE_BY_UUID = """
        DELETE FROM types_vehicules WHERE type_vehicule_uuid = :uuid
        """;

    // ========== REQUÊTES DE COMPTAGE ==========

    public static final String COUNT_ALL = """
        SELECT COUNT(*) FROM types_vehicules
        """;

    public static final String COUNT_ACTIFS = """
        SELECT COUNT(*) FROM types_vehicules WHERE actif = TRUE
        """;
}