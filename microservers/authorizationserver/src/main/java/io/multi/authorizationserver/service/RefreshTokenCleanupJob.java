package io.multi.authorizationserver.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Purge planifiée des refresh tokens expirés (sinon la table refresh_token
 * grossit indéfiniment). Tourne chaque jour à 4h. Cf dette
 * backend-refresh-token-cleanup-cron-monitoring (monitoring à ajouter).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RefreshTokenCleanupJob {

    private final RefreshTokenStore store;

    @Scheduled(cron = "0 0 4 * * *")
    public void cleanupExpired() {
        try {
            int n = store.deleteExpired();
            log.info("refresh_token cleanup : {} token(s) expiré(s) supprimé(s)", n);
        } catch (Exception e) {
            log.error("refresh_token cleanup échoué : {}", e.getMessage());
        }
    }
}
