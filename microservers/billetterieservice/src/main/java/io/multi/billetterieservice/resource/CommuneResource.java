package io.multi.billetterieservice.resource;

import io.multi.billetterieservice.domain.Response;
import io.multi.billetterieservice.dto.CommuneCreateRequest;
import io.multi.billetterieservice.dto.CommuneUpdateRequest;
import io.multi.billetterieservice.dto.RegionStatusRequest;
import io.multi.billetterieservice.response.CommuneResponse;
import io.multi.billetterieservice.service.CommuneService;
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
 * Contrôleur REST pour la gestion des communes.
 * Base path: /billetterie/communes
 */
@RestController
@RequestMapping("/billetterie/communes")
@RequiredArgsConstructor
@Slf4j
public class CommuneResource {

    private final CommuneService communeService;

    /**
     * Crée une nouvelle commune.
     * POST /billetterie/communes
     */
    @PostMapping
    public ResponseEntity<Response> createCommune(
            @Valid @RequestBody CommuneCreateRequest request,
            HttpServletRequest httpRequest) {
        log.info("POST /billetterie/communes - Création d'une commune: {} dans la ville: {}",
                request.getLibelle(), request.getVilleUuid());

        CommuneResponse response = communeService.createCommune(request);
        return ResponseEntity.status(CREATED).body(
                getResponse(httpRequest, Map.of("commune", response), "Commune créée avec succès", CREATED)
        );
    }

    /**
     * Met à jour une commune.
     * PUT /billetterie/communes/{communeUuid}
     */
    @PutMapping("/{communeUuid}")
    public ResponseEntity<Response> updateCommune(
            @PathVariable(name = "communeUuid") String communeUuid,
            @Valid @RequestBody CommuneUpdateRequest request,
            HttpServletRequest httpRequest) {
        log.info("PUT /billetterie/communes/{} - Mise à jour de la commune", communeUuid);

        CommuneResponse response = communeService.updateCommune(communeUuid, request);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("commune", response), "Commune mise à jour avec succès", OK)
        );
    }

    /**
     * Active ou désactive une commune.
     * PATCH /billetterie/communes/{communeUuid}/status
     */
    @PatchMapping("/{communeUuid}/status")
    public ResponseEntity<Response> updateCommuneStatus(
            @PathVariable(name = "communeUuid") String communeUuid,
            @Valid @RequestBody RegionStatusRequest request,
            HttpServletRequest httpRequest) {
        log.info("PATCH /billetterie/communes/{}/status - actif={}", communeUuid, request.getActif());

        CommuneResponse response = communeService.updateCommuneStatus(communeUuid, request.getActif());
        String message = request.getActif() ? "Commune activée avec succès" : "Commune désactivée avec succès";
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("commune", response), message, OK)
        );
    }

    /**
     * Récupère toutes les communes.
     * GET /billetterie/communes
     */
    @GetMapping
    public ResponseEntity<Response> getAllCommunes(HttpServletRequest httpRequest) {
        log.info("GET /billetterie/communes - Récupération de toutes les communes");

        List<CommuneResponse> communes = communeService.getAllCommunes();
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("communes", communes, "total", communes.size()),
                        "Liste des communes récupérée avec succès", OK)
        );
    }

    /**
     * Récupère toutes les communes actives.
     * GET /billetterie/communes/active
     */
    @GetMapping("/active")
    public ResponseEntity<Response> getActiveCommunes(HttpServletRequest httpRequest) {
        log.info("GET /billetterie/communes/active - Récupération des communes actives");

        List<CommuneResponse> communes = communeService.getActiveCommunes();
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("communes", communes, "total", communes.size()),
                        "Liste des communes actives récupérée avec succès", OK)
        );
    }

    /**
     * Récupère les communes d'une ville.
     * GET /billetterie/communes/ville/{villeUuid}
     */
    @GetMapping("/ville/{villeUuid}")
    public ResponseEntity<Response> getCommunesByVille(
            @PathVariable(name = "villeUuid") String villeUuid,
            HttpServletRequest httpRequest) {
        log.info("GET /billetterie/communes/ville/{} - Récupération des communes", villeUuid);

        List<CommuneResponse> communes = communeService.getCommunesByVille(villeUuid);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("communes", communes, "total", communes.size(), "villeUuid", villeUuid),
                        "Liste des communes de la ville récupérée avec succès", OK)
        );
    }

    /**
     * Récupère les communes actives d'une ville.
     * GET /billetterie/communes/ville/{villeUuid}/active
     */
    @GetMapping("/ville/{villeUuid}/active")
    public ResponseEntity<Response> getActiveCommunesByVille(
            @PathVariable(name = "villeUuid") String villeUuid,
            HttpServletRequest httpRequest) {
        log.info("GET /billetterie/communes/ville/{}/active - Récupération des communes actives", villeUuid);

        List<CommuneResponse> communes = communeService.getActiveCommunesByVille(villeUuid);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("communes", communes, "total", communes.size(), "villeUuid", villeUuid),
                        "Liste des communes actives de la ville récupérée avec succès", OK)
        );
    }

    /**
     * Récupère les communes d'une région.
     * GET /billetterie/communes/region/{regionUuid}
     */
    @GetMapping("/region/{regionUuid}")
    public ResponseEntity<Response> getCommunesByRegion(
            @PathVariable(name = "regionUuid") String regionUuid,
            HttpServletRequest httpRequest) {
        log.info("GET /billetterie/communes/region/{} - Récupération des communes", regionUuid);

        List<CommuneResponse> communes = communeService.getCommunesByRegion(regionUuid);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("communes", communes, "total", communes.size(), "regionUuid", regionUuid),
                        "Liste des communes de la région récupérée avec succès", OK)
        );
    }

    /**
     * Récupère une commune par son UUID.
     * GET /billetterie/communes/{communeUuid}
     */
    @GetMapping("/{communeUuid}")
    public ResponseEntity<Response> getCommuneByUuid(
            @PathVariable(name = "communeUuid") String communeUuid,
            HttpServletRequest httpRequest) {
        log.info("GET /billetterie/communes/{} - Récupération de la commune", communeUuid);

        CommuneResponse response = communeService.getCommuneByUuid(communeUuid);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("commune", response), "Commune récupérée avec succès", OK)
        );
    }
}