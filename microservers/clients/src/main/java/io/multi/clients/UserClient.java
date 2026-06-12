package io.multi.clients;

import io.multi.clients.domain.User;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;


// URL directe Docker DNS (workaround bug Eureka Spring Cloud 4.2.0 Content-Type
// octet-stream — registry jamais peuplé). Override par USERSERVICE_URL en docker
// compose, fallback localhost:8095 pour dev local Mac.
// Convention projet : tout nouveau @FeignClient doit suivre ce pattern. Cf dette
// feign-eureka-bypass-debt.
@FeignClient(name = "userservice", url = "${userservice.url:http://localhost:8095}")
public interface UserClient {

    /**
     * Lookup user by ID via userservice.
     *
     * <h2>⚠️ Dépendance silencieuse au permitAll de userservice</h2>
     * Cet appel Feign est émis <b>SANS Authorization header</b>. Spring Cloud OpenFeign
     * n'a pas de {@code RequestInterceptor} configuré dans ce projet pour propager le
     * JWT du caller ni pour obtenir un token M2M. userservice traite donc la requête
     * en <b>anonyme</b>, et ne répond 200 que parce que {@code /user/getUser/**} est
     * listé dans le {@code requestMatchers(...).permitAll()} de
     * {@code userservice/src/main/java/io/multi/userservice/security/ResourceServerConfig.java}.
     *
     * <h3>Déclencheur de casse (dette #23)</h3>
     * Le jour où {@code "/user/getUser/**"} est retiré du {@code permitAll()} de
     * {@code ResourceServerConfig#securityFilterChain}, <b>tous les appelants
     * Feign tombent ENSEMBLE en 401 silencieux</b> (catchés dans try/catch locaux :
     * emails non envoyés, lookups null, aucune alerte). Ce déclencheur traverse
     * <b>plusieurs services</b> : pour la liste actuelle à jour des sites
     * consommateurs, exécuter :
     * <pre>grep -rn "userClient\.getUserBy" microservers/</pre>
     *
     * <h3>Sortie de cette dette</h3>
     * Ajouter un Feign {@code RequestInterceptor} qui obtient un token
     * {@code client_credentials} (M2M) auprès de l'authorization server et l'attache
     * aux requêtes sortantes, puis fermer le permitAll côté userservice. <b>Les deux
     * changements doivent venir dans le même commit</b>, et appliqués à tous les
     * services consommateurs.
     */
    @GetMapping(path = "/user/getUser/{userId}")
    User getUserById(
            @PathVariable(name = "userId") Long userId);

    /** Voir {@link #getUserById(Long)} — même dépendance permitAll s'applique. */
    @GetMapping("/user/getUser/uuid/{uuid}")
    User getUserByUuid(@PathVariable(name ="uuid" ) String uuid);

    /**
     * Liste les comptes ayant un rôle donné (ex. ADMIN_BACKOFFICE pour le routing des
     * leads contact/visite). Renvoie {@code List<User>} DIRECT (endpoint userservice non
     * enveloppé). Même dépendance permitAll {@code /user/by-role/**} que {@link #getUserById(Long)}.
     */
    @GetMapping("/user/by-role/{roleName}")
    List<User> getUsersByRole(@PathVariable(name = "roleName") String roleName);
}
