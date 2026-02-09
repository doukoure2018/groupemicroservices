package io.multi.billetterieservice.resource;

import io.multi.billetterieservice.domain.Response;
import io.multi.billetterieservice.dto.RegionStatusRequest;
import io.multi.billetterieservice.dto.VilleCreateRequest;
import io.multi.billetterieservice.dto.VilleUpdateRequest;
import io.multi.billetterieservice.response.VilleResponse;
import io.multi.billetterieservice.service.VilleService;
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
 * Contrôleur REST pour la gestion des villes.
 * Base path: /billetterie/villes
 */
@RestController
@RequestMapping("/billetterie/villes")
@RequiredArgsConstructor
@Slf4j
public class VilleResource {

    private final VilleService villeService;

    /**
     * Crée une nouvelle ville.
     * POST /billetterie/villes
     *
     * @param request     Les données de la ville à créer
     * @param httpRequest La requête HTTP
     * @return La ville créée avec le statut 201 CREATED
     */
    @PostMapping
    public ResponseEntity<Response> createVille(
            @Valid @RequestBody VilleCreateRequest request,
            HttpServletRequest httpRequest) {
        log.info("POST /billetterie/villes - Création d'une ville: {} dans la région: {}",
                request.getLibelle(), request.getRegionUuid());

        VilleResponse response = villeService.createVille(request);
        return ResponseEntity.status(CREATED).body(
                getResponse(httpRequest, Map.of("ville", response), "Ville créée avec succès", CREATED)
        );
    }

    /**
     * Met à jour une ville.
     * PUT /billetterie/villes/{villeUuid}
     *
     * @param villeUuid   L'UUID de la ville à mettre à jour
     * @param request     Les nouvelles données
     * @param httpRequest La requête HTTP
     * @return La ville mise à jour
     */
    @PutMapping("/{villeUuid}")
    public ResponseEntity<Response> updateVille(
            @PathVariable(name = "villeUuid") String villeUuid,
            @Valid @RequestBody VilleUpdateRequest request,
            HttpServletRequest httpRequest) {
        log.info("PUT /billetterie/villes/{} - Mise à jour de la ville", villeUuid);

        VilleResponse response = villeService.updateVille(villeUuid, request);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("ville", response), "Ville mise à jour avec succès", OK)
        );
    }

    /**
     * Active ou désactive une ville.
     * PATCH /billetterie/villes/{villeUuid}/status
     *
     * @param villeUuid   L'UUID de la ville
     * @param request     Le nouveau statut (actif: true/false)
     * @param httpRequest La requête HTTP
     * @return La ville mise à jour
     */
    @PatchMapping("/{villeUuid}/status")
    public ResponseEntity<Response> updateVilleStatus(
            @PathVariable(name = "villeUuid") String villeUuid,
            @Valid @RequestBody RegionStatusRequest request,
            HttpServletRequest httpRequest) {
        log.info("PATCH /billetterie/villes/{}/status - Mise à jour du statut: actif={}", villeUuid, request.getActif());

        VilleResponse response = villeService.updateVilleStatus(villeUuid, request.getActif());
        String message = request.getActif() ? "Ville activée avec succès" : "Ville désactivée avec succès";
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("ville", response), message, OK)
        );
    }

    /**
     * Récupère toutes les villes.
     * GET /billetterie/villes
     *
     * @param httpRequest La requête HTTP
     * @return Liste de toutes les villes
     */
    @GetMapping
    public ResponseEntity<Response> getAllVilles(HttpServletRequest httpRequest) {
        log.info("GET /billetterie/villes - Récupération de toutes les villes");

        List<VilleResponse> villes = villeService.getAllVilles();
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("villes", villes, "total", villes.size()),
                        "Liste des villes récupérée avec succès", OK)
        );
    }

    /**
     * Récupère toutes les villes actives.
     * GET /billetterie/villes/active
     *
     * @param httpRequest La requête HTTP
     * @return Liste des villes actives
     */
    @GetMapping("/active")
    public ResponseEntity<Response> getActiveVilles(HttpServletRequest httpRequest) {
        log.info("GET /billetterie/villes/active - Récupération des villes actives");

        List<VilleResponse> villes = villeService.getActiveVilles();
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("villes", villes, "total", villes.size()),
                        "Liste des villes actives récupérée avec succès", OK)
        );
    }

    /**
     * Récupère les villes d'une région.
     * GET /billetterie/villes/region/{regionUuid}
     *
     * @param regionUuid  L'UUID de la région
     * @param httpRequest La requête HTTP
     * @return Liste des villes de la région
     */
    @GetMapping("/region/{regionUuid}")
    public ResponseEntity<Response> getVillesByRegion(
            @PathVariable(name = "regionUuid") String regionUuid,
            HttpServletRequest httpRequest) {
        log.info("GET /billetterie/villes/region/{} - Récupération des villes de la région", regionUuid);

        List<VilleResponse> villes = villeService.getVillesByRegion(regionUuid);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("villes", villes, "total", villes.size(), "regionUuid", regionUuid),
                        "Liste des villes de la région récupérée avec succès", OK)
        );
    }

    /**
     * Récupère les villes actives d'une région.
     * GET /billetterie/villes/region/{regionUuid}/active
     *
     * @param regionUuid  L'UUID de la région
     * @param httpRequest La requête HTTP
     * @return Liste des villes actives de la région
     */
    @GetMapping("/region/{regionUuid}/active")
    public ResponseEntity<Response> getActiveVillesByRegion(
            @PathVariable(name = "regionUuid") String regionUuid,
            HttpServletRequest httpRequest) {
        log.info("GET /billetterie/villes/region/{}/active - Récupération des villes actives de la région", regionUuid);

        List<VilleResponse> villes = villeService.getActiveVillesByRegion(regionUuid);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("villes", villes, "total", villes.size(), "regionUuid", regionUuid),
                        "Liste des villes actives de la région récupérée avec succès", OK)
        );
    }

    /**
     * Récupère une ville par son UUID.
     * GET /billetterie/villes/{villeUuid}
     *
     * @param villeUuid   L'UUID de la ville
     * @param httpRequest La requête HTTP
     * @return La ville trouvée
     */
    @GetMapping("/{villeUuid}")
    public ResponseEntity<Response> getVilleByUuid(
            @PathVariable(name = "villeUuid") String villeUuid,
            HttpServletRequest httpRequest) {
        log.info("GET /billetterie/villes/{} - Récupération de la ville", villeUuid);

        VilleResponse response = villeService.getVilleByUuid(villeUuid);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("ville", response), "Ville récupérée avec succès", OK)
        );
    }
}