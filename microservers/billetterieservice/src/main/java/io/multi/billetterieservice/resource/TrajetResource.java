package io.multi.billetterieservice.resource;

import io.multi.billetterieservice.domain.Response;
import io.multi.billetterieservice.domain.Trajet;
import io.multi.billetterieservice.dto.TrajetRequest;
import io.multi.billetterieservice.service.TrajetService;
import io.multi.billetterieservice.utils.JwtUtils;
import io.multi.clients.UserClient;
import io.multi.clients.domain.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static io.multi.billetterieservice.utils.RequestUtils.getResponse;
import static org.springframework.http.HttpStatus.*;

/**
 * Contrôleur REST pour la gestion des trajets.
 * Base path: /billetterie/trajets
 */
@RestController
@RequestMapping("/billetterie/trajets")
@RequiredArgsConstructor
@Slf4j
public class TrajetResource {

    private final TrajetService trajetService;
    private final JwtUtils jwtUtils;

    // ========== ENDPOINTS DE LECTURE ==========

    /**
     * GET /billetterie/trajets - Liste tous les trajets
     */
    @GetMapping
    public ResponseEntity<Response> getAll(HttpServletRequest request) {
        log.info("GET /billetterie/trajets - Récupération de tous les trajets");
        List<Trajet> trajets = trajetService.getAll();
        return ResponseEntity.ok(
                getResponse(request, Map.of("trajets", trajets, "total", trajets.size()),
                        "Trajets récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/trajets/actifs - Liste trajets actifs
     */
    @GetMapping("/actifs")
    public ResponseEntity<Response> getAllActifs(HttpServletRequest request) {
        log.info("GET /billetterie/trajets/actifs - Récupération des trajets actifs");
        List<Trajet> trajets = trajetService.getAllActifs();
        return ResponseEntity.ok(
                getResponse(request, Map.of("trajets", trajets, "total", trajets.size()),
                        "Trajets actifs récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/trajets/{uuid} - Détail d'un trajet
     */
    @GetMapping("/{uuid}")
    public ResponseEntity<Response> getByUuid(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request)
    {
        log.info("GET /billetterie/trajets/{} - Récupération du trajet", uuid);
        Trajet trajet = trajetService.getByUuid(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("trajet", trajet), "Trajet récupéré avec succès", OK)
        );
    }

    /**
     * GET /billetterie/trajets/depart/{departUuid} - Trajets par départ
     */
    @GetMapping("/depart/{departUuid}")
    public ResponseEntity<Response> getByDepart(
            @PathVariable(name = "departUuid") String departUuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/trajets/depart/{} - Récupération par départ", departUuid);
        List<Trajet> trajets = trajetService.getByDepart(departUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("trajets", trajets, "total", trajets.size()),
                        "Trajets récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/trajets/arrivee/{arriveeUuid} - Trajets par arrivée
     */
    @GetMapping("/arrivee/{arriveeUuid}")
    public ResponseEntity<Response> getByArrivee(
            @PathVariable(name = "arriveeUuid") String arriveeUuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/trajets/arrivee/{} - Récupération par arrivée", arriveeUuid);
        List<Trajet> trajets = trajetService.getByArrivee(arriveeUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("trajets", trajets, "total", trajets.size()),
                        "Trajets récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/trajets/ville-depart/{villeUuid} - Trajets par ville départ
     */
    @GetMapping("/ville-depart/{villeUuid}")
    public ResponseEntity<Response> getByVilleDepart(
            @PathVariable(name = "villeUuid") String villeUuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/trajets/ville-depart/{} - Récupération par ville départ", villeUuid);
        List<Trajet> trajets = trajetService.getByVilleDepart(villeUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("trajets", trajets, "total", trajets.size()),
                        "Trajets récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/trajets/ville-arrivee/{villeUuid} - Trajets par ville arrivée
     */
    @GetMapping("/ville-arrivee/{villeUuid}")
    public ResponseEntity<Response> getByVilleArrivee(
            @PathVariable(name = "villeUuid") String villeUuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/trajets/ville-arrivee/{} - Récupération par ville arrivée", villeUuid);
        List<Trajet> trajets = trajetService.getByVilleArrivee(villeUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("trajets", trajets, "total", trajets.size()),
                        "Trajets récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/trajets/villes?villeDepartUuid=x&villeArriveeUuid=y - Trajets entre 2 villes
     */
    @GetMapping("/villes")
    public ResponseEntity<Response> getByVilles(
            @RequestParam(name = "villeDepartUuid") String villeDepartUuid,
            @RequestParam(name = "villeArriveeUuid") String villeArriveeUuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/trajets/villes - De {} vers {}", villeDepartUuid, villeArriveeUuid);
        List<Trajet> trajets = trajetService.getByVilles(villeDepartUuid, villeArriveeUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("trajets", trajets, "total", trajets.size()),
                        "Trajets récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/trajets/search?q=terme - Recherche
     */
    @GetMapping("/search")
    public ResponseEntity<Response> search(
            @RequestParam(name = "q") String searchTerm,
            HttpServletRequest request) {
        log.info("GET /billetterie/trajets/search?q={} - Recherche", searchTerm);
        List<Trajet> trajets = trajetService.search(searchTerm);
        return ResponseEntity.ok(
                getResponse(request, Map.of("trajets", trajets, "total", trajets.size()),
                        "Recherche effectuée avec succès", OK)
        );
    }

    /**
     * GET /billetterie/trajets/mes-trajets - Trajets de l'utilisateur connecté
     */
    @GetMapping("/mes-trajets")
    public ResponseEntity<Response> getMesTrajets(
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {
        Long userId = jwtUtils.extractUserId(jwt);
        log.info("GET /billetterie/trajets/mes-trajets - userId: {}", userId);
        List<Trajet> trajets = trajetService.getByUser(userId);
        return ResponseEntity.ok(
                getResponse(request, Map.of("trajets", trajets, "total", trajets.size()),
                        "Mes trajets récupérés avec succès", OK)
        );
    }

    // ========== ENDPOINTS D'ÉCRITURE ==========

    /**
     * POST /billetterie/trajets - Créer un trajet
     */
    @PostMapping
    public ResponseEntity<Response> create(
            @Valid @RequestBody TrajetRequest trajetRequest,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request)
    {
        Long userId = jwtUtils.extractUserId(jwt);
        log.info("POST /billetterie/trajets - Création par userId: {}", userId);
        Trajet trajet = trajetService.create(trajetRequest, userId);
        return ResponseEntity.status(CREATED).body(
                getResponse(request, Map.of("trajet", trajet), "Trajet créé avec succès", CREATED)
        );
    }

    /**
     * PUT /billetterie/trajets/{uuid} - Mettre à jour
     */
    @PutMapping("/{uuid}")
    public ResponseEntity<Response> update(
            @PathVariable(name = "uuid") String uuid,
            @Valid @RequestBody TrajetRequest trajetRequest,
            HttpServletRequest request) {
        log.info("PUT /billetterie/trajets/{} - Mise à jour", uuid);
        Trajet trajet = trajetService.update(uuid, trajetRequest);
        return ResponseEntity.ok(
                getResponse(request, Map.of("trajet", trajet), "Trajet mis à jour avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/trajets/{uuid}/montants - MAJ montants
     */
    @PatchMapping("/{uuid}/montants")
    public ResponseEntity<Response> updateMontants(
            @PathVariable(name = "uuid") String uuid,
            @RequestParam(name="montantBase") BigDecimal montantBase,
            @RequestParam(required = false,name = "montantBagages") BigDecimal montantBagages,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/trajets/{}/montants - Montant: {}", uuid, montantBase);
        Trajet trajet = trajetService.updateMontants(uuid, montantBase, montantBagages);
        return ResponseEntity.ok(
                getResponse(request, Map.of("trajet", trajet), "Montants mis à jour avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/trajets/{uuid}/activer - Activer
     */
    @PatchMapping("/{uuid}/activer")
    public ResponseEntity<Response> activate(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/trajets/{}/activer", uuid);
        Trajet trajet = trajetService.activate(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("trajet", trajet), "Trajet activé avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/trajets/{uuid}/desactiver - Désactiver
     */
    @PatchMapping("/{uuid}/desactiver")
    public ResponseEntity<Response> deactivate(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/trajets/{}/desactiver", uuid);
        Trajet trajet = trajetService.deactivate(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("trajet", trajet), "Trajet désactivé avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/trajets/{uuid}/toggle-actif - Basculer actif/inactif
     */
    @PatchMapping("/{uuid}/toggle-actif")
    public ResponseEntity<Response> toggleActif(
            @PathVariable(name="uuid") String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/trajets/{}/toggle-actif", uuid);
        Trajet trajet = trajetService.toggleActif(uuid);
        String message = Boolean.TRUE.equals(trajet.getActif())
                ? "Trajet activé avec succès"
                : "Trajet désactivé avec succès";
        return ResponseEntity.ok(
                getResponse(request, Map.of("trajet", trajet), message, OK)
        );
    }

    /**
     * DELETE /billetterie/trajets/{uuid} - Supprimer
     */
    @DeleteMapping("/{uuid}")
    public ResponseEntity<Response> delete(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request) {
        log.info("DELETE /billetterie/trajets/{}", uuid);
        trajetService.delete(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of(), "Trajet supprimé avec succès", OK)
        );
    }

    // ========== ENDPOINTS STATISTIQUES ==========

    /**
     * GET /billetterie/trajets/stats - Statistiques
     */
    @GetMapping("/stats")
    public ResponseEntity<Response> getStats(HttpServletRequest request) {
        log.info("GET /billetterie/trajets/stats");
        long total = trajetService.count();
        long actifs = trajetService.countActifs();
        return ResponseEntity.ok(
                getResponse(request, Map.of(
                        "total", total,
                        "actifs", actifs,
                        "inactifs", total - actifs
                ), "Statistiques des trajets récupérées", OK)
        );
    }


}