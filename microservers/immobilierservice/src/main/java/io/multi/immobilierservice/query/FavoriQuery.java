package io.multi.immobilierservice.query;

public final class FavoriQuery {

    private FavoriQuery() {}

    /**
     * Insertion idempotente : le user clique 2 fois "favori" → pas de doublon BD,
     * pas d'erreur API. Le compteur nombre_favoris (trigger V13) ne s'incrémente
     * que sur INSERT effectif.
     */
    public static final String INSERT_FAVORI = """
            INSERT INTO immo_favori (user_id, propriete_id)
            VALUES (:userId, :proprieteId)
            ON CONFLICT (user_id, propriete_id) DO NOTHING
            RETURNING *
            """;

    public static final String DELETE_FAVORI = """
            DELETE FROM immo_favori
            WHERE user_id = :userId AND propriete_id = :proprieteId
            """;

    public static final String CHECK_FAVORI = """
            SELECT EXISTS (
                SELECT 1 FROM immo_favori
                WHERE user_id = :userId AND propriete_id = :proprieteId
            )
            """;

    /**
     * Liste les favoris d'un user. JOIN sur immo_propriete pour pouvoir trier
     * et exclure les annonces non publiées (le vendeur a peut-être retiré).
     */
    public static final String FIND_FAVORIS_OF_USER = """
            SELECT p.*, f.created_at AS favori_at
            FROM immo_favori f
            INNER JOIN immo_propriete p ON p.propriete_id = f.propriete_id
            WHERE f.user_id = :userId
              AND p.statut = 'PUBLIE'
            ORDER BY f.created_at DESC
            LIMIT :limit OFFSET :offset
            """;

    public static final String COUNT_FAVORIS_OF_USER = """
            SELECT COUNT(*) FROM immo_favori f
            INNER JOIN immo_propriete p ON p.propriete_id = f.propriete_id
            WHERE f.user_id = :userId AND p.statut = 'PUBLIE'
            """;

    /** Lookup propriete_id depuis l'UUID public. */
    public static final String LOOKUP_PROPRIETE_ID_BY_UUID = """
            SELECT propriete_id FROM immo_propriete WHERE propriete_uuid = :proprieteUuid
            """;
}
