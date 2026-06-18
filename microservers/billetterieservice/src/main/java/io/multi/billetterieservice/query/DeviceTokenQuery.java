package io.multi.billetterieservice.query;

public final class DeviceTokenQuery {

    private DeviceTokenQuery() {}

    /** Upsert : un token appartient à un seul device ; sur conflit il migre au user courant. */
    public static final String UPSERT = """
        INSERT INTO device_tokens (user_id, token, platform, last_seen_at)
        VALUES (:userId, :token, :platform, now())
        ON CONFLICT (token) DO UPDATE
            SET user_id = EXCLUDED.user_id,
                platform = EXCLUDED.platform,
                last_seen_at = now()
        """;

    public static final String FIND_TOKENS_BY_USER = """
        SELECT token FROM device_tokens WHERE user_id = :userId
        """;

    public static final String DELETE_BY_TOKEN = """
        DELETE FROM device_tokens WHERE token = :token
        """;
}
