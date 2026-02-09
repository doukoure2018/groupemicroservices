package io.multi.billetterieservice.resource;


import io.multi.billetterieservice.domain.Depart;
import io.multi.billetterieservice.domain.Response;
import io.multi.billetterieservice.dto.DepartRequest;
import io.multi.billetterieservice.service.DepartService;
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

@RestController
@RequestMapping("/billetterie/departs")
@RequiredArgsConstructor
@Slf4j
public class DepartResource {

    private final DepartService departService;

    /**
     * GET /billetterie/departs - Récupérer tous les départs
     */
    @GetMapping
    public ResponseEntity<Response> getAllDeparts(HttpServletRequest request) {
        log.info("GET /billetterie/departs - Récupération de tous les départs");
        List<Depart> departs = departService.getAllDeparts();
        return ResponseEntity.ok(
                getResponse(request, Map.of("departs", departs), "Départs récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/departs/actifs - Récupérer tous les départs actifs
     */
    @GetMapping("/actifs")
    public ResponseEntity<Response> getAllDepartsActifs(HttpServletRequest request) {
        log.info("GET /billetterie/departs/actifs - Récupération des départs actifs");
        List<Depart> departs = departService.getAllDepartsActifs();
        return ResponseEntity.ok(
                getResponse(request, Map.of("departs", departs), "Départs actifs récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/departs/{uuid} - Récupérer un départ par UUID
     */
    @GetMapping("/{uuid}")
    public ResponseEntity<Response> getDepartByUuid(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/departs/{} - Récupération du départ", uuid);
        Depart depart = departService.getDepartByUuid(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("depart", depart), "Départ récupéré avec succès", OK)
        );
    }

    /**
     * GET /billetterie/departs/site/{siteUuid} - Récupérer les départs par site
     */
    @GetMapping("/site/{siteUuid}")
    public ResponseEntity<Response> getDepartsBySite(
            @PathVariable(name = "siteUuid") String siteUuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/departs/site/{} - Récupération par site", siteUuid);
        List<Depart> departs = departService.getDepartsBySite(siteUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("departs", departs), "Départs récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/departs/site/{siteUuid}/actifs - Récupérer les départs actifs par site
     */
    @GetMapping("/site/{siteUuid}/actifs")
    public ResponseEntity<Response> getDepartsBySiteActifs(
            @PathVariable(name = "siteUuid") String siteUuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/departs/site/{}/actifs - Récupération des départs actifs par site", siteUuid);
        List<Depart> departs = departService.getDepartsBySiteActifs(siteUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("departs", departs), "Départs actifs récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/departs/ville/{villeUuid} - Récupérer les départs par ville
     */
    @GetMapping("/ville/{villeUuid}")
    public ResponseEntity<Response> getDepartsByVille(
            @PathVariable(name = "villeUuid") String villeUuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/departs/ville/{} - Récupération par ville", villeUuid);
        List<Depart> departs = departService.getDepartsByVille(villeUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("departs", departs), "Départs récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/departs/search?q=xxx - Rechercher des départs
     */
    @GetMapping("/search")
    public ResponseEntity<Response> searchDeparts(
            @RequestParam("q") String searchTerm,
            HttpServletRequest request) {
        log.info("GET /billetterie/departs/search?q={} - Recherche", searchTerm);
        List<Depart> departs = departService.searchDeparts(searchTerm);
        return ResponseEntity.ok(
                getResponse(request, Map.of("departs", departs), "Recherche effectuée avec succès", OK)
        );
    }

    /**
     * POST /billetterie/departs - Créer un nouveau départ
     */
    @PostMapping
    public ResponseEntity<Response> createDepart(
            @Valid @RequestBody DepartRequest departRequest,
            HttpServletRequest request) {
        log.info("POST /billetterie/departs - Création d'un départ: {}", departRequest.getLibelle());

        Depart depart = Depart.builder()
                .libelle(departRequest.getLibelle())
                .description(departRequest.getDescription())
                .ordreAffichage(departRequest.getOrdreAffichage())
                .actif(departRequest.getActif() != null ? departRequest.getActif() : true)
                .build();

        Depart createdDepart = departService.createDepart(depart, departRequest.getSiteUuid());

        return ResponseEntity.status(CREATED).body(
                getResponse(request, Map.of("depart", createdDepart), "Départ créé avec succès", CREATED)
        );
    }

    /**
     * PUT /billetterie/departs/{uuid} - Mettre à jour un départ
     */
    @PutMapping("/{uuid}")
    public ResponseEntity<Response> updateDepart(
            @PathVariable(name = "uuid") String uuid,
            @Valid @RequestBody DepartRequest departRequest,
            HttpServletRequest request) {
        log.info("PUT /billetterie/departs/{} - Mise à jour du départ", uuid);

        Depart depart = Depart.builder()
                .libelle(departRequest.getLibelle())
                .description(departRequest.getDescription())
                .ordreAffichage(departRequest.getOrdreAffichage())
                .actif(departRequest.getActif())
                .build();

        Depart updatedDepart = departService.updateDepart(uuid, depart, departRequest.getSiteUuid());

        return ResponseEntity.ok(
                getResponse(request, Map.of("depart", updatedDepart), "Départ mis à jour avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/departs/{uuid}/toggle-actif - Basculer le statut actif
     */
    @PatchMapping("/{uuid}/toggle-actif")
    public ResponseEntity<Response> toggleActif(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/departs/{}/toggle-actif - Basculement du statut", uuid);
        Depart depart = departService.toggleActif(uuid);
        String message = depart.getActif() ? "Départ activé avec succès" : "Départ désactivé avec succès";
        return ResponseEntity.ok(
                getResponse(request, Map.of("depart", depart), message, OK)
        );
    }

    /**
     * DELETE /billetterie/departs/{uuid} - Supprimer un départ
     */
    @DeleteMapping("/{uuid}")
    public ResponseEntity<Response> deleteDepart(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request) {
        log.info("DELETE /billetterie/departs/{} - Suppression du départ", uuid);
        departService.deleteDepart(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of(), "Départ supprimé avec succès", OK)
        );
    }
}