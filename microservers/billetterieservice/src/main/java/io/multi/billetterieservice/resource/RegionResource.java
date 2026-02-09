package io.multi.billetterieservice.resource;

import io.multi.billetterieservice.domain.Response;
import io.multi.billetterieservice.dto.RegionCreateRequest;
import io.multi.billetterieservice.dto.RegionStatusRequest;
import io.multi.billetterieservice.dto.RegionUpdateRequest;
import io.multi.billetterieservice.response.RegionResponse;
import io.multi.billetterieservice.service.RegionService;
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
 * Contrôleur REST pour la gestion des régions.
 * Base path: /billetterie/regions
 */
@RestController
@RequestMapping("/billetterie/regions")
@RequiredArgsConstructor
@Slf4j
public class RegionResource {

    private final RegionService regionService;

    /**
     * Crée une nouvelle région.
     * POST /billetterie/regions
     *
     * @param request     Les données de la région à créer
     * @param httpRequest La requête HTTP
     * @return La région créée avec le statut 201 CREATED
     */
    @PostMapping
    public ResponseEntity<Response> createRegion(
            @Valid @RequestBody RegionCreateRequest request,
            HttpServletRequest httpRequest) {
        log.info("POST /billetterie/regions - Création d'une région: {}", request.getLibelle());

        RegionResponse response = regionService.createRegion(request);
        return ResponseEntity.status(CREATED).body(
                getResponse(httpRequest, Map.of("region", response), "Région créée avec succès", CREATED)
        );
    }

    /**
     * Met à jour le libellé et le code d'une région.
     * PUT /billetterie/regions/{regionUuid}
     *
     * @param regionUuid  L'UUID de la région à mettre à jour
     * @param request     Les nouvelles données
     * @param httpRequest La requête HTTP
     * @return La région mise à jour
     */
    @PutMapping("/{regionUuid}")
    public ResponseEntity<Response> updateRegion(
            @PathVariable(name = "regionUuid") String regionUuid,
            @Valid @RequestBody RegionUpdateRequest request,
            HttpServletRequest httpRequest) {
        log.info("PUT /billetterie/regions/{} - Mise à jour de la région", regionUuid);

        RegionResponse response = regionService.updateRegion(regionUuid, request);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("region", response), "Région mise à jour avec succès", OK)
        );
    }

    /**
     * Active ou désactive une région.
     * PATCH /billetterie/regions/{regionUuid}/status
     *
     * @param regionUuid  L'UUID de la région
     * @param request     Le nouveau statut (actif: true/false)
     * @param httpRequest La requête HTTP
     * @return La région mise à jour
     */
    @PatchMapping("/{regionUuid}/status")
    public ResponseEntity<Response> updateRegionStatus(
            @PathVariable(name = "regionUuid") String regionUuid,
            @Valid @RequestBody RegionStatusRequest request,
            HttpServletRequest httpRequest) {
        log.info("PATCH /billetterie/regions/{}/status - Mise à jour du statut: actif={}", regionUuid, request.getActif());

        RegionResponse response = regionService.updateRegionStatus(regionUuid, request);
        String message = request.getActif() ? "Région activée avec succès" : "Région désactivée avec succès";
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("region", response), message, OK)
        );
    }

    /**
     * Récupère toutes les régions.
     * GET /billetterie/regions
     *
     * @param httpRequest La requête HTTP
     * @return Liste de toutes les régions
     */
    @GetMapping
    public ResponseEntity<Response> getAllRegions(HttpServletRequest httpRequest) {
        log.info("GET /billetterie/regions - Récupération de toutes les régions");

        List<RegionResponse> regions = regionService.getAllRegions();
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("regions", regions, "total", regions.size()), "Liste des régions récupérée avec succès", OK)
        );
    }

    /**
     * Récupère toutes les régions actives.
     * GET /billetterie/regions/active
     *
     * @param httpRequest La requête HTTP
     * @return Liste des régions actives
     */
    @GetMapping("/active")
    public ResponseEntity<Response> getActiveRegions(HttpServletRequest httpRequest) {
        log.info("GET /billetterie/regions/active - Récupération des régions actives");

        List<RegionResponse> regions = regionService.getActiveRegions();
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("regions", regions, "total", regions.size()), "Liste des régions actives récupérée avec succès", OK)
        );
    }

    /**
     * Récupère une région par son UUID.
     * GET /billetterie/regions/{regionUuid}
     *
     * @param regionUuid  L'UUID de la région
     * @param httpRequest La requête HTTP
     * @return La région trouvée
     */
    @GetMapping("/{regionUuid}")
    public ResponseEntity<Response> getRegionByUuid(
            @PathVariable(name = "regionUuid") String regionUuid,
            HttpServletRequest httpRequest) {
        log.info("GET /billetterie/regions/{} - Récupération de la région", regionUuid);

        RegionResponse response = regionService.getRegionByUuid(regionUuid);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("region", response), "Région récupérée avec succès", OK)
        );
    }
}