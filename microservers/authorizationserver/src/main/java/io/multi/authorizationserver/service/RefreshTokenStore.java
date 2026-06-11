package io.multi.authorizationserver.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;

/**
 * État serveur des refresh tokens (table refresh_token, V26) — donne la
 * révocation/rotation que le JWT stateless ne permettait pas.
 *   - save     : à l'émission d'un refresh token (jti = JWT ID)
 *   - isActive : présent + non révoqué + non expiré (check au /refresh)
 *   - revoke   : rotation (ancien jti) ou logout (jti courant)
 *   - revokeAllForUser : logout-all + password-change (userservice écrit
 *     directement dans cette table, cf dette cross-service-refresh-token-coupling)
 *   - deleteExpired : purge planifiée (RefreshTokenCleanupJob)
 */
@Slf4j
@Repository
@RequiredArgsConstructor
public class RefreshTokenStore {

    private final JdbcClient jdbcClient;

    public void save(String jti, long userId, Instant expiresAt) {
        jdbcClient.sql("""
                INSERT INTO refresh_token (jti, user_id, expires_at)
                VALUES (:jti, :userId, :expiresAt)
                """)
                .param("jti", jti)
                .param("userId", userId)
                .param("expiresAt", Timestamp.from(expiresAt))
                .update();
    }

    /** Actif = existe, non révoqué, non expiré. */
    public boolean isActive(String jti) {
        if (jti == null) return false;
        Integer n = jdbcClient.sql("""
                SELECT COUNT(*) FROM refresh_token
                WHERE jti = :jti AND revoked = FALSE AND expires_at > now()
                """)
                .param("jti", jti)
                .query(Integer.class)
                .single();
        return n != null && n > 0;
    }

    public void revoke(String jti) {
        jdbcClient.sql("UPDATE refresh_token SET revoked = TRUE, last_used_at = now() WHERE jti = :jti")
                .param("jti", jti)
                .update();
    }

    public void revokeAllForUser(long userId) {
        jdbcClient.sql("UPDATE refresh_token SET revoked = TRUE WHERE user_id = :userId AND revoked = FALSE")
                .param("userId", userId)
                .update();
    }

    /** Purge les tokens expirés (planifié). Retourne le nombre supprimé. */
    public int deleteExpired() {
        return jdbcClient.sql("DELETE FROM refresh_token WHERE expires_at < now()").update();
    }
}
