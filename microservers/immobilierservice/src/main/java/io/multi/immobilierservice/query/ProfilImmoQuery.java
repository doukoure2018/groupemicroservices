package io.multi.immobilierservice.query;

public final class ProfilImmoQuery {

    private ProfilImmoQuery() {}

    public static final String INSERT_PROFIL = """
            INSERT INTO immo_profil (
                user_id, type_profil, agence_id,
                documents_kyc_url, bio, telephone_contact
            ) VALUES (
                :userId, :typeProfil, :agenceId,
                :documentsKycUrl, :bio, :telephoneContact
            )
            RETURNING *
            """;

    public static final String UPDATE_PROFIL = """
            UPDATE immo_profil SET
                bio = :bio,
                telephone_contact = :telephoneContact,
                documents_kyc_url = :documentsKycUrl,
                updated_at = CURRENT_TIMESTAMP
            WHERE profil_uuid = :profilUuid
            RETURNING *
            """;

    public static final String UPDATE_STATUT_VERIFICATION = """
            UPDATE immo_profil SET
                statut_verification = :statut,
                updated_at = CURRENT_TIMESTAMP
            WHERE profil_uuid = :profilUuid
            RETURNING *
            """;

    public static final String FIND_BY_UUID = """
            SELECT * FROM immo_profil WHERE profil_uuid = :profilUuid
            """;

    public static final String FIND_BY_USER_ID = """
            SELECT * FROM immo_profil WHERE user_id = :userId
            """;

    public static final String FIND_BY_AGENCE = """
            SELECT * FROM immo_profil
            WHERE agence_id = :agenceId AND actif = TRUE
            ORDER BY created_at DESC
            """;

    public static final String DELETE_PROFIL = """
            UPDATE immo_profil SET actif = FALSE, updated_at = CURRENT_TIMESTAMP
            WHERE profil_uuid = :profilUuid
            """;

    public static final String INCREMENT_PROPRIETES_ACTIVES = """
            UPDATE immo_profil SET
                nombre_proprietes_actives = nombre_proprietes_actives + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE profil_id = :profilId
            """;

    public static final String DECREMENT_PROPRIETES_ACTIVES = """
            UPDATE immo_profil SET
                nombre_proprietes_actives = GREATEST(nombre_proprietes_actives - 1, 0),
                updated_at = CURRENT_TIMESTAMP
            WHERE profil_id = :profilId
            """;
}
