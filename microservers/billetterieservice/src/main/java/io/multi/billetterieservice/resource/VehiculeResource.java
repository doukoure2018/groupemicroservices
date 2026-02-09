package io.multi.billetterieservice.resource;

import io.multi.billetterieservice.domain.Response;
import io.multi.billetterieservice.domain.Vehicule;
import io.multi.billetterieservice.dto.VehiculeRequest;
import io.multi.billetterieservice.service.VehiculeService;
import io.multi.billetterieservice.utils.JwtUtils;
import io.multi.clients.UserClient;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import static io.multi.billetterieservice.utils.RequestUtils.getResponse;
import static org.springframework.http.HttpStatus.*;

/**
 * Contrôleur REST pour la gestion des véhicules.
 * Base path: /billetterie/vehicules
 */
@RestController
@RequestMapping("/billetterie/vehicules")
@RequiredArgsConstructor
@Slf4j
public class VehiculeResource {

    private final VehiculeService vehiculeService;
    private final JwtUtils jwtUtils;

    // ========== ENDPOINTS DE LECTURE ==========

    /**
     * GET /billetterie/vehicules - Liste tous les véhicules
     */
    @GetMapping
    public ResponseEntity<Response> getAll(HttpServletRequest request) {
        log.info("GET /billetterie/vehicules - Récupération de tous les véhicules");
        List<Vehicule> vehicules = vehiculeService.getAll();
        return ResponseEntity.ok(
                getResponse(request, Map.of("vehicules", vehicules, "total", vehicules.size()),
                        "Véhicules récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/vehicules/actifs - Liste véhicules actifs
     */
    @GetMapping("/actifs")
    public ResponseEntity<Response> getAllActifs(HttpServletRequest request) {
        log.info("GET /billetterie/vehicules/actifs - Récupération des véhicules actifs");
        List<Vehicule> vehicules = vehiculeService.getAllActifs();
        return ResponseEntity.ok(
                getResponse(request, Map.of("vehicules", vehicules, "total", vehicules.size()),
                        "Véhicules actifs récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/vehicules/{uuid} - Détail d'un véhicule
     */
    @GetMapping("/{uuid}")
    public ResponseEntity<Response> getByUuid(
            @PathVariable String uuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/vehicules/{} - Récupération du véhicule", uuid);
        Vehicule vehicule = vehiculeService.getByUuid(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("vehicule", vehicule),
                        "Véhicule récupéré avec succès", OK)
        );
    }

    /**
     * GET /billetterie/vehicules/immatriculation/{immatriculation} - Par immatriculation
     */
    @GetMapping("/immatriculation/{immatriculation}")
    public ResponseEntity<Response> getByImmatriculation(
            @PathVariable(name = "immatriculation") String immatriculation,
            HttpServletRequest request) {
        log.info("GET /billetterie/vehicules/immatriculation/{}", immatriculation);
        Vehicule vehicule = vehiculeService.getByImmatriculation(immatriculation);
        return ResponseEntity.ok(
                getResponse(request, Map.of("vehicule", vehicule),
                        "Véhicule récupéré avec succès", OK)
        );
    }

    /**
     * GET /billetterie/vehicules/mes-vehicules - Véhicules de l'utilisateur connecté
     */
    @GetMapping("/mes-vehicules")
    public ResponseEntity<Response> getMesVehicules(
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request)
    {
        Long userId = jwtUtils.extractUserId(jwt);
        log.info("GET /billetterie/vehicules/mes-vehicules - userId: {}", userId);
        List<Vehicule> vehicules = vehiculeService.getMesVehicules(userId);
        return ResponseEntity.ok(
                getResponse(request, Map.of("vehicules", vehicules, "total", vehicules.size()),
                        "Mes véhicules récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/vehicules/type/{typeVehiculeUuid} - Par type de véhicule
     */
    @GetMapping("/type/{typeVehiculeUuid}")
    public ResponseEntity<Response> getByTypeVehicule(
            @PathVariable(name = "typeVehiculeUuid") String typeVehiculeUuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/vehicules/type/{}", typeVehiculeUuid);
        List<Vehicule> vehicules = vehiculeService.getByTypeVehicule(typeVehiculeUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("vehicules", vehicules, "total", vehicules.size()),
                        "Véhicules récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/vehicules/statut/{statut} - Par statut
     */
    @GetMapping("/statut/{statut}")
    public ResponseEntity<Response> getByStatut(
            @PathVariable(name = "statut") String statut,
            HttpServletRequest request) {
        log.info("GET /billetterie/vehicules/statut/{}", statut);
        List<Vehicule> vehicules = vehiculeService.getByStatut(statut);
        return ResponseEntity.ok(
                getResponse(request, Map.of("vehicules", vehicules, "total", vehicules.size()),
                        "Véhicules récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/vehicules/places-min/{nombrePlaces} - Par nombre de places minimum
     */
    @GetMapping("/places-min/{nombrePlaces}")
    public ResponseEntity<Response> getByNombrePlacesMin(
            @PathVariable(name = "nombrePlaces") int nombrePlaces,
            HttpServletRequest request) {
        log.info("GET /billetterie/vehicules/places-min/{}", nombrePlaces);
        List<Vehicule> vehicules = vehiculeService.getByNombrePlacesMin(nombrePlaces);
        return ResponseEntity.ok(
                getResponse(request, Map.of("vehicules", vehicules, "total", vehicules.size()),
                        "Véhicules récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/vehicules/climatises - Véhicules climatisés
     */
    @GetMapping("/climatises")
    public ResponseEntity<Response> getClimatises(HttpServletRequest request) {
        log.info("GET /billetterie/vehicules/climatises");
        List<Vehicule> vehicules = vehiculeService.getClimatises();
        return ResponseEntity.ok(
                getResponse(request, Map.of("vehicules", vehicules, "total", vehicules.size()),
                        "Véhicules climatisés récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/vehicules/assurance-expiree - Assurance expirée
     */
    @GetMapping("/assurance-expiree")
    public ResponseEntity<Response> getAssuranceExpiree(HttpServletRequest request) {
        log.info("GET /billetterie/vehicules/assurance-expiree");
        List<Vehicule> vehicules = vehiculeService.getAssuranceExpiree();
        return ResponseEntity.ok(
                getResponse(request, Map.of("vehicules", vehicules, "total", vehicules.size()),
                        "Véhicules avec assurance expirée récupérés", OK)
        );
    }

    /**
     * GET /billetterie/vehicules/visite-expiree - Visite technique expirée
     */
    @GetMapping("/visite-expiree")
    public ResponseEntity<Response> getVisiteExpiree(HttpServletRequest request) {
        log.info("GET /billetterie/vehicules/visite-expiree");
        List<Vehicule> vehicules = vehiculeService.getVisiteExpiree();
        return ResponseEntity.ok(
                getResponse(request, Map.of("vehicules", vehicules, "total", vehicules.size()),
                        "Véhicules avec visite technique expirée récupérés", OK)
        );
    }

    /**
     * GET /billetterie/vehicules/search?q=terme - Recherche
     */
    @GetMapping("/search")
    public ResponseEntity<Response> search(
            @RequestParam(name = "q") String searchTerm,
            HttpServletRequest request) {
        log.info("GET /billetterie/vehicules/search?q={}", searchTerm);
        List<Vehicule> vehicules = vehiculeService.search(searchTerm);
        return ResponseEntity.ok(
                getResponse(request, Map.of("vehicules", vehicules, "total", vehicules.size()),
                        "Recherche effectuée avec succès", OK)
        );
    }

    // ========== ENDPOINTS D'ÉCRITURE ==========

    /**
     * POST /billetterie/vehicules - Créer un véhicule
     */
    @PostMapping
    public ResponseEntity<Response> create(
            @Valid @RequestBody VehiculeRequest vehiculeRequest,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request)
    {
        Long userId = jwtUtils.extractUserId(jwt);
        log.info("POST /billetterie/vehicules - Création par userId: {}", userId);
        Vehicule vehicule = vehiculeService.create(vehiculeRequest, userId);
        return ResponseEntity.status(CREATED).body(
                getResponse(request, Map.of("vehicule", vehicule),
                        "Véhicule créé avec succès", CREATED)
        );
    }

    /**
     * PUT /billetterie/vehicules/{uuid} - Mettre à jour
     */
    @PutMapping("/{uuid}")
    public ResponseEntity<Response> update(
            @PathVariable(name = "uuid") String uuid,
            @Valid @RequestBody VehiculeRequest vehiculeRequest,
            HttpServletRequest request) {
        log.info("PUT /billetterie/vehicules/{}", uuid);
        Vehicule vehicule = vehiculeService.update(uuid, vehiculeRequest);
        return ResponseEntity.ok(
                getResponse(request, Map.of("vehicule", vehicule),
                        "Véhicule mis à jour avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/vehicules/{uuid}/statut - Changer le statut
     */
    @PatchMapping("/{uuid}/statut")
    public ResponseEntity<Response> updateStatut(
            @PathVariable(name = "uuid") String uuid,
            @RequestParam String statut,
            HttpServletRequest request)
    {
        log.info("PATCH /billetterie/vehicules/{}/statut -> {}", uuid, statut);
        Vehicule vehicule = vehiculeService.updateStatut(uuid, statut);
        return ResponseEntity.ok(
                getResponse(request, Map.of("vehicule", vehicule),
                        "Statut du véhicule mis à jour avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/vehicules/{uuid}/activer - Activer
     */
    @PatchMapping("/{uuid}/activer")
    public ResponseEntity<Response> activer(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/vehicules/{}/activer", uuid);
        Vehicule vehicule = vehiculeService.activer(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("vehicule", vehicule),
                        "Véhicule activé avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/vehicules/{uuid}/desactiver - Désactiver
     */
    @PatchMapping("/{uuid}/desactiver")
    public ResponseEntity<Response> desactiver(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/vehicules/{}/desactiver", uuid);
        Vehicule vehicule = vehiculeService.desactiver(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("vehicule", vehicule),
                        "Véhicule désactivé avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/vehicules/{uuid}/maintenance - Mettre en maintenance
     */
    @PatchMapping("/{uuid}/maintenance")
    public ResponseEntity<Response> mettreEnMaintenance(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request)
    {
        log.info("PATCH /billetterie/vehicules/{}/maintenance", uuid);
        Vehicule vehicule = vehiculeService.mettreEnMaintenance(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("vehicule", vehicule),
                        "Véhicule mis en maintenance avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/vehicules/{uuid}/suspendre - Suspendre
     */
    @PatchMapping("/{uuid}/suspendre")
    public ResponseEntity<Response> suspendre(
            @PathVariable String uuid,
            HttpServletRequest request)
    {
        log.info("PATCH /billetterie/vehicules/{}/suspendre", uuid);
        Vehicule vehicule = vehiculeService.suspendre(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("vehicule", vehicule),
                        "Véhicule suspendu avec succès", OK)
        );
    }

    /**
     * DELETE /billetterie/vehicules/{uuid} - Supprimer
     */
    @DeleteMapping("/{uuid}")
    public ResponseEntity<Response> delete(
            @PathVariable String uuid,
            HttpServletRequest request) {
        log.info("DELETE /billetterie/vehicules/{}", uuid);
        vehiculeService.delete(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of(), "Véhicule supprimé avec succès", OK)
        );
    }

    // ========== ENDPOINTS STATISTIQUES ==========

    /**
     * GET /billetterie/vehicules/stats - Statistiques
     */
    @GetMapping("/stats")
    public ResponseEntity<Response> getStats(HttpServletRequest request) {
        log.info("GET /billetterie/vehicules/stats");
        long total = vehiculeService.count();
        long actifs = vehiculeService.countByStatut("ACTIF");
        long inactifs = vehiculeService.countByStatut("INACTIF");
        long enMaintenance = vehiculeService.countByStatut("EN_MAINTENANCE");
        long suspendus = vehiculeService.countByStatut("SUSPENDU");

        return ResponseEntity.ok(
                getResponse(request, Map.of(
                        "total", total,
                        "actifs", actifs,
                        "inactifs", inactifs,
                        "enMaintenance", enMaintenance,
                        "suspendus", suspendus
                ), "Statistiques récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/vehicules/mes-stats - Statistiques de l'utilisateur
     */
    @GetMapping("/mes-stats")
    public ResponseEntity<Response> getMesStats(
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {
        Long userId = jwtUtils.extractUserId(jwt);
        log.info("GET /billetterie/vehicules/mes-stats - userId: {}", userId);
        long total = vehiculeService.countByUser(userId);
        return ResponseEntity.ok(
                getResponse(request, Map.of("total", total),
                        "Statistiques récupérées avec succès", OK)
        );
    }


}