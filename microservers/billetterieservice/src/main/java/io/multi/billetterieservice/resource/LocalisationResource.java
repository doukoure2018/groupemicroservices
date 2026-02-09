package io.multi.billetterieservice.resource;

import io.multi.billetterieservice.domain.Response;
import io.multi.billetterieservice.dto.LocalisationCreateRequest;
import io.multi.billetterieservice.dto.LocalisationUpdateRequest;
import io.multi.billetterieservice.response.LocalisationResponse;
import io.multi.billetterieservice.service.LocalisationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import static io.multi.billetterieservice.utils.RequestUtils.getResponse;
import static org.springframework.http.HttpStatus.*;

/**
 * Contrôleur REST pour la gestion des localisations.
 * Base path: /billetterie/localisations
 */
@RestController
@RequestMapping("/billetterie/localisations")
@RequiredArgsConstructor
@Slf4j
public class LocalisationResource {

    private final LocalisationService localisationService;

    /**
     * Crée une nouvelle localisation.
     * POST /billetterie/localisations
     */
    @PostMapping
    public ResponseEntity<Response> createLocalisation(
            @Valid @RequestBody LocalisationCreateRequest request,
            HttpServletRequest httpRequest) {
        log.info("POST /billetterie/localisations - Création d'une localisation: {}", request.getAdresseComplete());

        LocalisationResponse response = localisationService.createLocalisation(request);
        return ResponseEntity.status(CREATED).body(
                getResponse(httpRequest, Map.of("localisation", response), "Localisation créée avec succès", CREATED)
        );
    }

    /**
     * Met à jour une localisation.
     * PUT /billetterie/localisations/{localisationUuid}
     */
    @PutMapping("/{localisationUuid}")
    public ResponseEntity<Response> updateLocalisation(
            @PathVariable String localisationUuid,
            @Valid @RequestBody LocalisationUpdateRequest request,
            HttpServletRequest httpRequest) {
        log.info("PUT /billetterie/localisations/{} - Mise à jour de la localisation", localisationUuid);

        LocalisationResponse response = localisationService.updateLocalisation(localisationUuid, request);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("localisation", response), "Localisation mise à jour avec succès", OK)
        );
    }

    /**
     * Supprime une localisation.
     * DELETE /billetterie/localisations/{localisationUuid}
     */
    @DeleteMapping("/{localisationUuid}")
    public ResponseEntity<Response> deleteLocalisation(
            @PathVariable String localisationUuid,
            HttpServletRequest httpRequest) {
        log.info("DELETE /billetterie/localisations/{} - Suppression de la localisation", localisationUuid);

        localisationService.deleteLocalisation(localisationUuid);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of(), "Localisation supprimée avec succès", OK)
        );
    }

    /**
     * Récupère toutes les localisations.
     * GET /billetterie/localisations
     */
    @GetMapping
    public ResponseEntity<Response> getAllLocalisations(HttpServletRequest httpRequest) {
        log.info("GET /billetterie/localisations - Récupération de toutes les localisations");

        List<LocalisationResponse> localisations = localisationService.getAllLocalisations();
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("localisations", localisations, "total", localisations.size()),
                        "Liste des localisations récupérée avec succès", OK)
        );
    }

    /**
     * Récupère les localisations avec un quartier associé.
     * GET /billetterie/localisations/with-quartier
     */
    @GetMapping("/with-quartier")
    public ResponseEntity<Response> getLocalisationsWithQuartier(HttpServletRequest httpRequest) {
        log.info("GET /billetterie/localisations/with-quartier - Récupération des localisations avec quartier");

        List<LocalisationResponse> localisations = localisationService.getLocalisationsWithQuartier();
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("localisations", localisations, "total", localisations.size()),
                        "Liste des localisations avec quartier récupérée avec succès", OK)
        );
    }

    /**
     * Récupère les localisations sans quartier associé.
     * GET /billetterie/localisations/without-quartier
     */
    @GetMapping("/without-quartier")
    public ResponseEntity<Response> getLocalisationsWithoutQuartier(HttpServletRequest httpRequest) {
        log.info("GET /billetterie/localisations/without-quartier - Récupération des localisations sans quartier");

        List<LocalisationResponse> localisations = localisationService.getLocalisationsWithoutQuartier();
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("localisations", localisations, "total", localisations.size()),
                        "Liste des localisations sans quartier récupérée avec succès", OK)
        );
    }

    /**
     * Récupère les localisations d'un quartier.
     * GET /billetterie/localisations/quartier/{quartierUuid}
     */
    @GetMapping("/quartier/{quartierUuid}")
    public ResponseEntity<Response> getLocalisationsByQuartier(
            @PathVariable String quartierUuid,
            HttpServletRequest httpRequest) {
        log.info("GET /billetterie/localisations/quartier/{} - Récupération des localisations", quartierUuid);

        List<LocalisationResponse> localisations = localisationService.getLocalisationsByQuartier(quartierUuid);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("localisations", localisations, "total", localisations.size(), "quartierUuid", quartierUuid),
                        "Liste des localisations du quartier récupérée avec succès", OK)
        );
    }

    /**
     * Récupère les localisations d'une commune.
     * GET /billetterie/localisations/commune/{communeUuid}
     */
    @GetMapping("/commune/{communeUuid}")
    public ResponseEntity<Response> getLocalisationsByCommune(
            @PathVariable String communeUuid,
            HttpServletRequest httpRequest) {
        log.info("GET /billetterie/localisations/commune/{} - Récupération des localisations", communeUuid);

        List<LocalisationResponse> localisations = localisationService.getLocalisationsByCommune(communeUuid);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("localisations", localisations, "total", localisations.size(), "communeUuid", communeUuid),
                        "Liste des localisations de la commune récupérée avec succès", OK)
        );
    }

    /**
     * Récupère les localisations d'une ville.
     * GET /billetterie/localisations/ville/{villeUuid}
     */
    @GetMapping("/ville/{villeUuid}")
    public ResponseEntity<Response> getLocalisationsByVille(
            @PathVariable String villeUuid,
            HttpServletRequest httpRequest) {
        log.info("GET /billetterie/localisations/ville/{} - Récupération des localisations", villeUuid);

        List<LocalisationResponse> localisations = localisationService.getLocalisationsByVille(villeUuid);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("localisations", localisations, "total", localisations.size(), "villeUuid", villeUuid),
                        "Liste des localisations de la ville récupérée avec succès", OK)
        );
    }

    /**
     * Récupère les localisations d'une région.
     * GET /billetterie/localisations/region/{regionUuid}
     */
    @GetMapping("/region/{regionUuid}")
    public ResponseEntity<Response> getLocalisationsByRegion(
            @PathVariable String regionUuid,
            HttpServletRequest httpRequest) {
        log.info("GET /billetterie/localisations/region/{} - Récupération des localisations", regionUuid);

        List<LocalisationResponse> localisations = localisationService.getLocalisationsByRegion(regionUuid);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("localisations", localisations, "total", localisations.size(), "regionUuid", regionUuid),
                        "Liste des localisations de la région récupérée avec succès", OK)
        );
    }

    /**
     * Récupère une localisation par son UUID.
     * GET /billetterie/localisations/{localisationUuid}
     */
    @GetMapping("/{localisationUuid}")
    public ResponseEntity<Response> getLocalisationByUuid(
            @PathVariable String localisationUuid,
            HttpServletRequest httpRequest) {
        log.info("GET /billetterie/localisations/{} - Récupération de la localisation", localisationUuid);

        LocalisationResponse response = localisationService.getLocalisationByUuid(localisationUuid);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("localisation", response), "Localisation récupérée avec succès", OK)
        );
    }

    /**
     * Recherche des localisations par adresse.
     * GET /billetterie/localisations/search?q=xxx
     */
    @GetMapping("/search")
    public ResponseEntity<Response> searchLocalisations(
            @RequestParam("q") String searchTerm,
            HttpServletRequest httpRequest) {
        log.info("GET /billetterie/localisations/search?q={} - Recherche de localisations", searchTerm);

        List<LocalisationResponse> localisations = localisationService.searchLocalisations(searchTerm);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("localisations", localisations, "total", localisations.size(), "searchTerm", searchTerm),
                        "Recherche de localisations effectuée avec succès", OK)
        );
    }
}