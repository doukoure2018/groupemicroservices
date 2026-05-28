package io.multi.immobilierservice.repository;

import java.util.Optional;

/**
 * Lookup minimaliste sur la table users partagée (innodb), utilisé par les
 * producteurs de notifications quand UserClient Feign n'est pas viable :
 * <ul>
 *   <li>Contextes hors-HTTP (ex: @Scheduled où le JWT est absent et Feign
 *       envoie l'appel sans Authorization header → 401).</li>
 *   <li>Contextes async ({@code CompletableFuture.runAsync}) qui perdent
 *       le SecurityContext.</li>
 * </ul>
 *
 * <p>TODO : à supprimer le jour où un Feign RequestInterceptor JWT-aware
 * (M2M ou propagation) est ajouté côté immo. C'est une "fuite d'accès BD"
 * temporaire — immo lit une table qui appartient logiquement à userservice.
 */
public interface UserLookupRepository {

    record UserBasic(Long userId, String email, String username, String firstName,
                     String lastName, String phone) {
        public String nomComplet() {
            String n = ((firstName != null ? firstName : "") + " "
                    + (lastName != null ? lastName : "")).trim();
            return n.isBlank() ? (username != null ? username : "Utilisateur") : n;
        }
    }

    Optional<UserBasic> findById(Long userId);
}
