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

    // ── Intermédiation Phase 1 : leads back-office (filtrés par lead_statut) ──

    /** Liste back-office des leads contact, enrichie réf/titre propriété (join). */
    public static final String FIND_LEADS_FOR_ADMIN = """
            SELECT c.*, p.reference AS propriete_reference, p.titre AS propriete_titre
            FROM immo_contact c
            INNER JOIN immo_propriete p ON p.propriete_id = c.propriete_id
            WHERE c.lead_statut = :statut
            ORDER BY c.created_at DESC
            LIMIT :limit OFFSET :offset
            """;

    public static final String COUNT_LEADS_FOR_ADMIN = """
            SELECT COUNT(*) FROM immo_contact WHERE lead_statut = :statut
            """;

    /**
     * Mark-traité conditionnel : applique seulement si encore NOUVEAU.
     * Si lead_statut != 'NOUVEAU', 0 ligne mise à jour (RETURNING vide) →
     * n'écrase JAMAIS un traite_par/traite_at déjà posé.
     */
    public static final String UPDATE_LEAD_TRAITE = """
            UPDATE immo_contact SET
                lead_statut = :leadStatut,
                note_admin  = :noteAdmin,
                traite_par  = :adminUserId,
                traite_at   = CURRENT_TIMESTAMP
            WHERE contact_uuid = :contactUuid
              AND lead_statut = 'NOUVEAU'
            RETURNING *
            """;
}
