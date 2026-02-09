package io.multi.billetterieservice.resource;

import io.multi.billetterieservice.domain.Response;
import io.multi.billetterieservice.dto.QuartierCreateRequest;
import io.multi.billetterieservice.dto.QuartierUpdateRequest;
import io.multi.billetterieservice.dto.RegionStatusRequest;
import io.multi.billetterieservice.response.QuartierResponse;
import io.multi.billetterieservice.service.QuartierService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import static io.multi.billetterieservice.utils.RequestUtils.getResponse;
import static org.springframework.http.HttpStatus.CREATED;
import static org.springframework.http.HttpStatus.OK;

/**
 * Contrôleur REST pour la gestion des quartiers.
 * Base path: /billetterie/quartiers
 */
@RestController
@RequestMapping("/billetterie/quartiers")
@RequiredArgsConstructor
@Slf4j
public class QuartierResource {

    private final QuartierService quartierService;

    /**
     * Crée un nouveau quartier.
     * POST /billetterie/quartiers
     */
    @PostMapping
    public ResponseEntity<Response> createQuartier(
            @Valid @RequestBody QuartierCreateRequest request,
            HttpServletRequest httpRequest) {
        log.info("POST /billetterie/quartiers - Création d'un quartier: {} dans la commune: {}",
                request.getLibelle(), request.getCommuneUuid());

        QuartierResponse response = quartierService.createQuartier(request);
        return ResponseEntity.status(CREATED).body(
                getResponse(httpRequest, Map.of("quartier", response), "Quartier créé avec succès", CREATED)
        );
    }

    /**
     * Met à jour un quartier.
     * PUT /billetterie/quartiers/{quartierUuid}
     */
    @PutMapping("/{quartierUuid}")
    public ResponseEntity<Response> updateQuartier(
            @PathVariable(name = "quartierUuid") String quartierUuid,
            @Valid @RequestBody QuartierUpdateRequest request,
            HttpServletRequest httpRequest) {
        log.info("PUT /billetterie/quartiers/{} - Mise à jour du quartier", quartierUuid);

        QuartierResponse response = quartierService.updateQuartier(quartierUuid, request);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("quartier", response), "Quartier mis à jour avec succès", OK)
        );
    }

    /**
     * Active ou désactive un quartier.
     * PATCH /billetterie/quartiers/{quartierUuid}/status
     */
    @PatchMapping("/{quartierUuid}/status")
    public ResponseEntity<Response> updateQuartierStatus(
            @PathVariable(name = "quartierUuid") String quartierUuid,
            @Valid @RequestBody RegionStatusRequest request,
            HttpServletRequest httpRequest) {
        log.info("PATCH /billetterie/quartiers/{}/status - actif={}", quartierUuid, request.getActif());

        QuartierResponse response = quartierService.updateQuartierStatus(quartierUuid, request.getActif());
        String message = request.getActif() ? "Quartier activé avec succès" : "Quartier désactivé avec succès";
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("quartier", response), message, OK)
        );
    }

    /**
     * Récupère tous les quartiers.
     * GET /billetterie/quartiers
     */
    @GetMapping
    public ResponseEntity<Response> getAllQuartiers(HttpServletRequest httpRequest) {
        log.info("GET /billetterie/quartiers - Récupération de tous les quartiers");

        List<QuartierResponse> quartiers = quartierService.getAllQuartiers();
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("quartiers", quartiers, "total", quartiers.size()),
                        "Liste des quartiers récupérée avec succès", OK)
        );
    }

    /**
     * Récupère tous les quartiers actifs.
     * GET /billetterie/quartiers/active
     */
    @GetMapping("/active")
    public ResponseEntity<Response> getActiveQuartiers(HttpServletRequest httpRequest) {
        log.info("GET /billetterie/quartiers/active - Récupération des quartiers actifs");

        List<QuartierResponse> quartiers = quartierService.getActiveQuartiers();
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("quartiers", quartiers, "total", quartiers.size()),
                        "Liste des quartiers actifs récupérée avec succès", OK)
        );
    }

    /**
     * Récupère les quartiers d'une commune.
     * GET /billetterie/quartiers/commune/{communeUuid}
     */
    @GetMapping("/commune/{communeUuid}")
    public ResponseEntity<Response> getQuartiersByCommune(
            @PathVariable(name = "communeUuid") String communeUuid,
            HttpServletRequest httpRequest) {
        log.info("GET /billetterie/quartiers/commune/{} - Récupération des quartiers", communeUuid);

        List<QuartierResponse> quartiers = quartierService.getQuartiersByCommune(communeUuid);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("quartiers", quartiers, "total", quartiers.size(), "communeUuid", communeUuid),
                        "Liste des quartiers de la commune récupérée avec succès", OK)
        );
    }

    /**
     * Récupère les quartiers actifs d'une commune.
     * GET /billetterie/quartiers/commune/{communeUuid}/active
     */
    @GetMapping("/commune/{communeUuid}/active")
    public ResponseEntity<Response> getActiveQuartiersByCommune(
            @PathVariable(name = "communeUuid") String communeUuid,
            HttpServletRequest httpRequest) {
        log.info("GET /billetterie/quartiers/commune/{}/active - Récupération des quartiers actifs", communeUuid);

        List<QuartierResponse> quartiers = quartierService.getActiveQuartiersByCommune(communeUuid);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("quartiers", quartiers, "total", quartiers.size(), "communeUuid", communeUuid),
                        "Liste des quartiers actifs de la commune récupérée avec succès", OK)
        );
    }

    /**
     * Récupère les quartiers d'une ville.
     * GET /billetterie/quartiers/ville/{villeUuid}
     */
    @GetMapping("/ville/{villeUuid}")
    public ResponseEntity<Response> getQuartiersByVille(
            @PathVariable(name = "villeUuid") String villeUuid,
            HttpServletRequest httpRequest) {
        log.info("GET /billetterie/quartiers/ville/{} - Récupération des quartiers", villeUuid);

        List<QuartierResponse> quartiers = quartierService.getQuartiersByVille(villeUuid);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("quartiers", quartiers, "total", quartiers.size(), "villeUuid", villeUuid),
                        "Liste des quartiers de la ville récupérée avec succès", OK)
        );
    }

    /**
     * Récupère les quartiers d'une région.
     * GET /billetterie/quartiers/region/{regionUuid}
     */
    @GetMapping("/region/{regionUuid}")
    public ResponseEntity<Response> getQuartiersByRegion(
            @PathVariable(name = "regionUuid") String regionUuid,
            HttpServletRequest httpRequest) {
        log.info("GET /billetterie/quartiers/region/{} - Récupération des quartiers", regionUuid);

        List<QuartierResponse> quartiers = quartierService.getQuartiersByRegion(regionUuid);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("quartiers", quartiers, "total", quartiers.size(), "regionUuid", regionUuid),
                        "Liste des quartiers de la région récupérée avec succès", OK)
        );
    }

    /**
     * Récupère un quartier par son UUID.
     * GET /billetterie/quartiers/{quartierUuid}
     */
    @GetMapping("/{quartierUuid}")
    public ResponseEntity<Response> getQuartierByUuid(
            @PathVariable(name = "quartierUuid") String quartierUuid,
            HttpServletRequest httpRequest) {
        log.info("GET /billetterie/quartiers/{} - Récupération du quartier", quartierUuid);

        QuartierResponse response = quartierService.getQuartierByUuid(quartierUuid);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("quartier", response), "Quartier récupéré avec succès", OK)
        );
    }
}