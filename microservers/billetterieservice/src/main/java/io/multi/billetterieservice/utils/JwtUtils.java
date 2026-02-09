package io.multi.billetterieservice.utils;

import io.multi.clients.UserClient;
import io.multi.clients.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtUtils {

    private final UserClient userClient;

    public Long extractUserId(Jwt jwt) {
        log.debug("Extraction du user_id depuis le JWT. Claims disponibles: {}", jwt.getClaims().keySet());

        // Option 1: Si le JWT contient directement user_id
        Object userIdClaim = jwt.getClaim("user_id");
        if (userIdClaim != null) {
            log.debug("Claim user_id trouvé: {} (type: {})", userIdClaim, userIdClaim.getClass().getSimpleName());
            if (userIdClaim instanceof Long) {
                return (Long) userIdClaim;
            }
            if (userIdClaim instanceof Integer) {
                return ((Integer) userIdClaim).longValue();
            }
            if (userIdClaim instanceof String) {
                try {
                    return Long.parseLong((String) userIdClaim);
                } catch (NumberFormatException e) {
                    log.warn("user_id n'est pas un nombre valide: {}", userIdClaim);
                }
            }
        }

        // Option 2: Chercher userId dans d'autres claims communs
        String[] possibleClaims = {"userId", "uid", "id"};
        for (String claimName : possibleClaims) {
            Object claim = jwt.getClaim(claimName);
            if (claim != null) {
                log.debug("Claim {} trouvé: {}", claimName, claim);
                try {
                    if (claim instanceof Long) return (Long) claim;
                    if (claim instanceof Integer) return ((Integer) claim).longValue();
                    if (claim instanceof String) return Long.parseLong((String) claim);
                } catch (NumberFormatException e) {
                    log.warn("Claim {} n'est pas un nombre valide: {}", claimName, claim);
                }
            }
        }

        // Option 3: Le JWT contient user_uuid (sub ou user_uuid), on récupère l'userId via Feign
        String userUuid = jwt.getSubject();

        // Vérifier aussi le claim user_uuid
        Object userUuidClaim = jwt.getClaim("user_uuid");
        if (userUuidClaim instanceof String) {
            userUuid = (String) userUuidClaim;
            log.debug("Utilisation du claim user_uuid: {}", userUuid);
        }

        if (userUuid != null && !userUuid.isBlank()) {
            log.debug("Tentative de récupération de l'utilisateur par UUID: {}", userUuid);
            try {
                User user = userClient.getUserByUuid(userUuid);
                if (user != null && user.getUserId() != null) {
                    log.debug("Utilisateur trouvé: userId={}", user.getUserId());
                    return user.getUserId();
                }
            } catch (Exception e) {
                log.error("Erreur lors de la récupération de l'utilisateur par UUID {}: {}", userUuid, e.getMessage());
                throw new IllegalStateException("Impossible de récupérer l'utilisateur: " + e.getMessage());
            }
        }

        log.error("Impossible d'extraire user_id. Claims disponibles: {}", jwt.getClaims());
        throw new IllegalStateException(
                "user_id non trouvé dans le JWT et impossible de récupérer l'utilisateur par UUID. " +
                "Claims disponibles: " + jwt.getClaims().keySet()
        );
    }
}