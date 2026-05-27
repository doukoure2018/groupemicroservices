package io.multi.immobilierservice.query;

public final class ContactQuery {

    private ContactQuery() {}

    public static final String INSERT_CONTACT = """
            INSERT INTO immo_contact (
                propriete_id, demandeur_user_id,
                nom_demandeur, telephone_demandeur, email_demandeur,
                message, type_demande
            ) VALUES (
                :proprieteId, :demandeurUserId,
                :nomDemandeur, :telephoneDemandeur, :emailDemandeur,
                :message, :typeDemande
            )
            RETURNING *
            """;

    public static final String FIND_BY_UUID = """
            SELECT * FROM immo_contact WHERE contact_uuid = :contactUuid
            """;

    /** Contacts reçus par un vendeur (pour ses propriétés). */
    public static final String FIND_RECUS_BY_VENDEUR = """
            SELECT c.* FROM immo_contact c
            INNER JOIN immo_propriete p ON p.propriete_id = c.propriete_id
            INNER JOIN immo_profil prof ON prof.profil_id = p.profil_id
            WHERE prof.user_id = :vendeurUserId
            ORDER BY c.created_at DESC
            LIMIT :limit OFFSET :offset
            """;

    public static final String COUNT_RECUS_BY_VENDEUR = """
            SELECT COUNT(*) FROM immo_contact c
            INNER JOIN immo_propriete p ON p.propriete_id = c.propriete_id
            INNER JOIN immo_profil prof ON prof.profil_id = p.profil_id
            WHERE prof.user_id = :vendeurUserId
            """;

    /** Contacts envoyés par un user (acheteur potentiel). */
    public static final String FIND_ENVOYES_BY_USER = """
            SELECT * FROM immo_contact
            WHERE demandeur_user_id = :userId
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
            """;

    public static final String COUNT_ENVOYES_BY_USER = """
            SELECT COUNT(*) FROM immo_contact WHERE demandeur_user_id = :userId
            """;

    public static final String MARK_VU = """
            UPDATE immo_contact SET vu_par_vendeur = TRUE
            WHERE contact_uuid = :contactUuid
            RETURNING *
            """;

    /** Récupère le user_id du vendeur (owner) d'une propriété — pour autoriser MARK_VU. */
    public static final String FIND_VENDEUR_USER_ID = """
            SELECT prof.user_id
            FROM immo_contact c
            INNER JOIN immo_propriete p ON p.propriete_id = c.propriete_id
            INNER JOIN immo_profil prof ON prof.profil_id = p.profil_id
            WHERE c.contact_uuid = :contactUuid
            """;
}
