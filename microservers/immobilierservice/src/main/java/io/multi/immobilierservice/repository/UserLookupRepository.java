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
 * <h2>DETTE TECHNIQUE — à corriger avant production</h2>
 *
 * <p>Cette classe <b>viole le principe d'isolation microservices</b> : immo lit
 * directement la table {@code users} qui appartient logiquement à userservice.
 * Atténuation factuelle : la BD <b>PostgreSQL</b> (nommée {@code innodb} dans
 * {@code POSTGRES_DB} — nom historique trompeur, évoque MySQL/InnoDB) est
 * physiquement partagée par tous les services du repo (pattern "shared
 * database") — donc lire la table {@code users} depuis immo n'ajoute pas
 * de connexion cross-DB, mais reste une entorse au découpage logique.
 *
 * <p>La vraie solution est un token <b>service-to-service</b> :
 * <ol>
 *   <li>Ajouter {@code AuthorizationGrantType.CLIENT_CREDENTIALS} côté
 *       {@code authorizationserver} (actuellement seuls
 *       {@code authorization_code} et {@code refresh_token} sont configurés).</li>
 *   <li>Créer un client OAuth2 {@code immo-service} avec secret (équivalent
 *       du {@code mobile-app-client} mais pour M2M).</li>
 *   <li>Implémenter un Feign {@code RequestInterceptor} qui obtient et cache
 *       un access_token via le grant client_credentials.</li>
 *   <li>Ajuster {@code userservice} ResourceServer pour accepter ces tokens
 *       machine (vérification scope/role).</li>
 * </ol>
 *
 * <p>Une fois la chaîne M2M en place : supprimer cette classe et brancher
 * {@code userClient.getUserById()} dans tous les publishXxx().
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
