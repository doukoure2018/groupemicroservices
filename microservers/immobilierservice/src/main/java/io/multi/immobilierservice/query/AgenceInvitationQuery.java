package io.multi.immobilierservice.query;

public final class AgenceInvitationQuery {

    private AgenceInvitationQuery() {}

    public static final String INSERT_INVITATION = """
            INSERT INTO immo_agence_invitation (
                token, agence_id, invite_user_id, invite_par_user_id,
                bio_proposee, telephone_propose, date_expiration
            ) VALUES (
                :token, :agenceId, :inviteUserId, :inviteParUserId,
                :bioProposee, :telephonePropose, :dateExpiration
            )
            RETURNING *
            """;

    public static final String FIND_BY_TOKEN = """
            SELECT * FROM immo_agence_invitation WHERE token = :token
            """;

    public static final String FIND_BY_UUID = """
            SELECT * FROM immo_agence_invitation WHERE invitation_uuid = :invitationUuid
            """;

    public static final String FIND_ACTIVE_BY_AGENCE_USER = """
            SELECT * FROM immo_agence_invitation
            WHERE agence_id = :agenceId AND invite_user_id = :inviteUserId
              AND statut = 'EN_ATTENTE'
            """;

    public static final String FIND_PENDING_FOR_USER = """
            SELECT * FROM immo_agence_invitation
            WHERE invite_user_id = :userId
              AND statut = 'EN_ATTENTE'
              AND date_expiration > CURRENT_TIMESTAMP
            ORDER BY created_at DESC
            """;

    public static final String FIND_FOR_AGENCE = """
            SELECT * FROM immo_agence_invitation
            WHERE agence_id = :agenceId
            ORDER BY created_at DESC
            """;

    public static final String UPDATE_STATUT = """
            UPDATE immo_agence_invitation SET
                statut = :statut,
                motif_refus = :motifRefus,
                date_reponse = CURRENT_TIMESTAMP
            WHERE invitation_id = :invitationId
            RETURNING *
            """;

    /** Job planifié (Phase 12) : marque les invitations expirées. */
    public static final String MARK_EXPIRED = """
            UPDATE immo_agence_invitation SET
                statut = 'EXPIREE',
                date_reponse = CURRENT_TIMESTAMP
            WHERE statut = 'EN_ATTENTE'
              AND date_expiration <= CURRENT_TIMESTAMP
            """;
}
