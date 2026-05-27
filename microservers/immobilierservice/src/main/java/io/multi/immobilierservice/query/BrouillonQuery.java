package io.multi.immobilierservice.query;

public final class BrouillonQuery {

    private BrouillonQuery() {}

    public static final String INSERT_BROUILLON = """
            INSERT INTO immo_brouillon (user_id, donnees_json, etape_actuelle)
            VALUES (:userId, CAST(:donneesJson AS JSONB), :etapeActuelle)
            RETURNING *
            """;

    public static final String UPDATE_BROUILLON = """
            UPDATE immo_brouillon SET
                donnees_json = CAST(:donneesJson AS JSONB),
                etape_actuelle = :etapeActuelle,
                derniere_modification = CURRENT_TIMESTAMP
            WHERE brouillon_uuid = :brouillonUuid
            RETURNING *
            """;

    public static final String FIND_BY_UUID = """
            SELECT * FROM immo_brouillon WHERE brouillon_uuid = :brouillonUuid
            """;

    public static final String FIND_BY_USER = """
            SELECT * FROM immo_brouillon
            WHERE user_id = :userId
            ORDER BY derniere_modification DESC
            """;

    public static final String DELETE_BY_UUID = """
            DELETE FROM immo_brouillon WHERE brouillon_uuid = :brouillonUuid
            """;

    public static final String LINK_PROPRIETE = """
            UPDATE immo_brouillon SET propriete_id = :proprieteId
            WHERE brouillon_uuid = :brouillonUuid
            """;
}
