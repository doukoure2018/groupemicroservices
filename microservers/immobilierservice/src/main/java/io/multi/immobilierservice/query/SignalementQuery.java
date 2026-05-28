package io.multi.immobilierservice.query;

public final class SignalementQuery {

    private SignalementQuery() {}

    public static final String INSERT_SIGNALEMENT = """
            INSERT INTO immo_signalement (user_id, propriete_id, motif, description)
            VALUES (:userId, :proprieteId, :motif, :description)
            RETURNING *
            """;

    public static final String FIND_BY_UUID = """
            SELECT * FROM immo_signalement WHERE signalement_uuid = :signalementUuid
            """;

    /**
     * Liste pour l'admin avec compteur de signalements distincts par propriété.
     * Trie pour faire remonter les propriétés les plus signalées en haut
     * (aide à la priorisation manuelle — décision 10b-β).
     */
    public static final String FIND_FOR_ADMIN_BY_PROPRIETE = """
            WITH counts AS (
                SELECT propriete_id, COUNT(DISTINCT user_id) AS nb_distinct
                FROM immo_signalement
                WHERE statut = 'EN_ATTENTE'
                GROUP BY propriete_id
            )
            SELECT s.*, c.nb_distinct
            FROM immo_signalement s
            LEFT JOIN counts c ON c.propriete_id = s.propriete_id
            WHERE s.statut = :statut
            ORDER BY c.nb_distinct DESC NULLS LAST, s.created_at DESC
            LIMIT :limit OFFSET :offset
            """;

    public static final String COUNT_FOR_ADMIN = """
            SELECT COUNT(*) FROM immo_signalement WHERE statut = :statut
            """;

    /** Compte les signalements DISTINCTS (par user) sur une propriété — pour seuil J=3. */
    public static final String COUNT_DISTINCT_USERS_FOR_PROPRIETE = """
            SELECT COUNT(DISTINCT user_id) FROM immo_signalement
            WHERE propriete_id = :proprieteId AND statut = 'EN_ATTENTE'
            """;

    public static final String UPDATE_TRAITE = """
            UPDATE immo_signalement SET
                statut = :statut,
                traite_par = :adminUserId,
                date_traitement = CURRENT_TIMESTAMP,
                notes_admin = :notesAdmin
            WHERE signalement_uuid = :signalementUuid
              AND statut = 'EN_ATTENTE'
            RETURNING *
            """;

    /** Existence d'un signalement EN_ATTENTE du même user sur la même propriété. */
    public static final String EXISTS_SIGNALEMENT_OF_USER = """
            SELECT EXISTS (
                SELECT 1 FROM immo_signalement
                WHERE user_id = :userId AND propriete_id = :proprieteId
                  AND statut = 'EN_ATTENTE'
            )
            """;
}
