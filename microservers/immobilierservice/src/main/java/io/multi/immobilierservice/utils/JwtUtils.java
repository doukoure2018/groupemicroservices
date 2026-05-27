package io.multi.immobilierservice.utils;

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
        Object userIdClaim = jwt.getClaim("user_id");
        if (userIdClaim instanceof Long l) return l;
        if (userIdClaim instanceof Integer i) return i.longValue();
        if (userIdClaim instanceof String s) {
            try { return Long.parseLong(s); } catch (NumberFormatException ignored) {}
        }

        String userUuid = jwt.getSubject();
        Object userUuidClaim = jwt.getClaim("user_uuid");
        if (userUuidClaim instanceof String s) {
            userUuid = s;
        }

        if (userUuid != null && !userUuid.isBlank()) {
            try {
                User user = userClient.getUserByUuid(userUuid);
                if (user != null && user.getUserId() != null) {
                    return user.getUserId();
                }
            } catch (Exception e) {
                log.error("Erreur récupération user via Feign UUID={}: {}", userUuid, e.getMessage());
                throw new IllegalStateException("Impossible de récupérer l'utilisateur: " + e.getMessage());
            }
        }

        throw new IllegalStateException(
                "user_id non trouvé dans le JWT. Claims disponibles: " + jwt.getClaims().keySet()
        );
    }

    public boolean hasRole(Jwt jwt, String... roles) {
        String authorities = jwt.getClaimAsString("authorities");
        if (authorities == null) return false;
        for (String r : roles) {
            if (authorities.contains(r)) return true;
        }
        return false;
    }
}
