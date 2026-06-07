package io.multi.immobilierservice.query;

public final class AdminActionQuery {

    private AdminActionQuery() {}

    // CAST :proprieteUuid::uuid : la colonne propriete_uuid est de type UUID
    // mais on passe une String depuis Java (AdminAction.proprieteUuid: String).
    // Sans le cast explicite, PostgreSQL JDBC retourne "bad SQL grammar"
    // (le driver ne caste pas automatiquement String → UUID en prepared statement).
    // PhotoRepository n'a pas ce souci car photo_uuid a DEFAULT gen_random_uuid()
    // côté BD et n'est jamais inséré depuis Java.
    public static final String INSERT_ADMIN_ACTION = """
            INSERT INTO immo_admin_action (
                admin_user_id, propriete_uuid, action, motif
            ) VALUES (
                :adminUserId, CAST(:proprieteUuid AS uuid), :action, :motif
            )
            RETURNING *
            """;
}
