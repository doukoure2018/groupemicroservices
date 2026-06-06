package io.multi.immobilierservice.query;

public final class AdminActionQuery {

    private AdminActionQuery() {}

    public static final String INSERT_ADMIN_ACTION = """
            INSERT INTO immo_admin_action (
                admin_user_id, propriete_uuid, action, motif
            ) VALUES (
                :adminUserId, :proprieteUuid, :action, :motif
            )
            RETURNING *
            """;
}
