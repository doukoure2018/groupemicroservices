package io.multi.billetterieservice.query;

/**
 * Classe utilitaire contenant toutes les requêtes SQL pour l'entité ModeReglement.
 */
public final class ModeReglementQuery {

    private ModeReglementQuery() {
        // Classe utilitaire - pas d'instanciation
    }

    // ========== SELECT DE BASE ==========

    private static final String BASE_SELECT = """
        SELECT 
            mode_reglement_id,
            mode_reglement_uuid,
            libelle,
            code,
            description,
            icone_url,
            frais_pourcentage,
            frais_fixe,
            actif,
            created_at,
            updated_at
        FROM modes_reglement
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
        WHERE mode_reglement_uuid = :uuid
        """;

    public static final String FIND_BY_ID = BASE_SELECT + """
        WHERE mode_reglement_id = :id
        """;

    public static final String FIND_BY_CODE = BASE_SELECT + """
        WHERE UPPER(code) = UPPER(:code)
        """;

    public static final String FIND_BY_LIBELLE = BASE_SELECT + """
        WHERE LOWER(libelle) = LOWER(:libelle)
        """;

    public static final String SEARCH = BASE_SELECT + """
        WHERE LOWER(libelle) LIKE :searchTerm
           OR LOWER(code) LIKE :searchTerm
           OR LOWER(description) LIKE :searchTerm
        ORDER BY libelle ASC
        """;

    public static final String FIND_SANS_FRAIS = BASE_SELECT + """
        WHERE actif = TRUE
          AND (frais_pourcentage IS NULL OR frais_pourcentage = 0)
          AND (frais_fixe IS NULL OR frais_fixe = 0)
        ORDER BY libelle ASC
        """;

    // ========== REQUÊTES DE VÉRIFICATION ==========

    public static final String EXISTS_BY_CODE = """
        SELECT COUNT(*) FROM modes_reglement
        WHERE UPPER(code) = UPPER(:code)
        """;

    public static final String EXISTS_BY_CODE_EXCLUDING_UUID = """
        SELECT COUNT(*) FROM modes_reglement
        WHERE UPPER(code) = UPPER(:code)
          AND mode_reglement_uuid != :excludeUuid
        """;

    public static final String EXISTS_BY_LIBELLE = """
        SELECT COUNT(*) FROM modes_reglement
        WHERE LOWER(libelle) = LOWER(:libelle)
        """;

    public static final String EXISTS_BY_LIBELLE_EXCLUDING_UUID = """
        SELECT COUNT(*) FROM modes_reglement
        WHERE LOWER(libelle) = LOWER(:libelle)
          AND mode_reglement_uuid != :excludeUuid
        """;

    public static final String HAS_TRANSACTIONS = """
        SELECT COUNT(*) FROM transactions t
        WHERE t.mode_reglement_id = (
            SELECT mode_reglement_id FROM modes_reglement WHERE mode_reglement_uuid = :uuid
        )
        """;

    // ========== REQUÊTES D'ÉCRITURE ==========

    public static final String INSERT = """
        INSERT INTO modes_reglement (
            libelle, code, description, icone_url,
            frais_pourcentage, frais_fixe, actif
        ) VALUES (
            :libelle, :code, :description, :iconeUrl,
            :fraisPourcentage, :fraisFixe, :actif
        )
        RETURNING mode_reglement_id, mode_reglement_uuid, created_at, updated_at
        """;

    public static final String UPDATE = """
        UPDATE modes_reglement SET
            libelle = :libelle,
            code = :code,
            description = :description,
            icone_url = :iconeUrl,
            frais_pourcentage = :fraisPourcentage,
            frais_fixe = :fraisFixe,
            actif = :actif
        WHERE mode_reglement_uuid = :uuid
        RETURNING mode_reglement_id, created_at, updated_at
        """;

    public static final String UPDATE_FRAIS = """
        UPDATE modes_reglement SET
            frais_pourcentage = :fraisPourcentage,
            frais_fixe = :fraisFixe
        WHERE mode_reglement_uuid = :uuid
        """;

    public static final String UPDATE_ACTIF = """
        UPDATE modes_reglement SET actif = :actif
        WHERE mode_reglement_uuid = :uuid
        """;

    public static final String DELETE_BY_UUID = """
        DELETE FROM modes_reglement WHERE mode_reglement_uuid = :uuid
        """;

    // ========== REQUÊTES DE COMPTAGE ==========

    public static final String COUNT_ALL = """
        SELECT COUNT(*) FROM modes_reglement
        """;

    public static final String COUNT_ACTIFS = """
        SELECT COUNT(*) FROM modes_reglement WHERE actif = TRUE
        """;
}