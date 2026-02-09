package io.multi.billetterieservice.resource;


import io.multi.billetterieservice.domain.Arrivee;
import io.multi.billetterieservice.domain.Response;
import io.multi.billetterieservice.dto.ArriveeRequest;
import io.multi.billetterieservice.service.ArriveeService;
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
@RequestMapping("/billetterie/arrivees")
@RequiredArgsConstructor
@Slf4j
public class ArriveeResource {

    private final ArriveeService arriveeService;

    /**
     * GET /billetterie/arrivees - Récupérer toutes les arrivées
     */
    @GetMapping
    public ResponseEntity<Response> getAllArrivees(HttpServletRequest request) {
        log.info("GET /billetterie/arrivees - Récupération de toutes les arrivées");
        List<Arrivee> arrivees = arriveeService.getAllArrivees();
        return ResponseEntity.ok(
                getResponse(request, Map.of("arrivees", arrivees), "Arrivées récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/arrivees/actifs - Récupérer toutes les arrivées actives
     */
    @GetMapping("/actifs")
    public ResponseEntity<Response> getAllArriveesActifs(HttpServletRequest request) {
        log.info("GET /billetterie/arrivees/actifs - Récupération des arrivées actives");
        List<Arrivee> arrivees = arriveeService.getAllArriveesActifs();
        return ResponseEntity.ok(
                getResponse(request, Map.of("arrivees", arrivees), "Arrivées actives récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/arrivees/{uuid} - Récupérer une arrivée par UUID
     */
    @GetMapping("/{uuid}")
    public ResponseEntity<Response> getArriveeByUuid(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/arrivees/{} - Récupération de l'arrivée", uuid);
        Arrivee arrivee = arriveeService.getArriveeByUuid(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("arrivee", arrivee), "Arrivée récupérée avec succès", OK)
        );
    }

    /**
     * GET /billetterie/arrivees/site/{siteUuid} - Récupérer les arrivées par site
     */
    @GetMapping("/site/{siteUuid}")
    public ResponseEntity<Response> getArriveesBySite(
            @PathVariable(name = "siteUuid") String siteUuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/arrivees/site/{} - Récupération par site", siteUuid);
        List<Arrivee> arrivees = arriveeService.getArriveesBySite(siteUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("arrivees", arrivees), "Arrivées récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/arrivees/depart/{departUuid} - Récupérer les arrivées par départ
     */
    @GetMapping("/depart/{departUuid}")
    public ResponseEntity<Response> getArriveesByDepart(
            @PathVariable(name = "departUuid") String departUuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/arrivees/depart/{} - Récupération par départ", departUuid);
        List<Arrivee> arrivees = arriveeService.getArriveesByDepart(departUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("arrivees", arrivees), "Arrivées récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/arrivees/ville-arrivee/{villeUuid} - Récupérer les arrivées par ville d'arrivée
     */
    @GetMapping("/ville-arrivee/{villeUuid}")
    public ResponseEntity<Response> getArriveesByVilleArrivee(
            @PathVariable(name = "villeUuid") String villeUuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/arrivees/ville-arrivee/{} - Récupération par ville d'arrivée", villeUuid);
        List<Arrivee> arrivees = arriveeService.getArriveesByVilleArrivee(villeUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("arrivees", arrivees), "Arrivées récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/arrivees/ville-depart/{villeUuid} - Récupérer les arrivées par ville de départ
     */
    @GetMapping("/ville-depart/{villeUuid}")
    public ResponseEntity<Response> getArriveesByVilleDepart(
            @PathVariable(name = "villeUuid") String villeUuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/arrivees/ville-depart/{} - Récupération par ville de départ", villeUuid);
        List<Arrivee> arrivees = arriveeService.getArriveesByVilleDepart(villeUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("arrivees", arrivees), "Arrivées récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/arrivees/trajet?departUuid=xxx&villeArriveeUuid=yyy - Récupérer les arrivées pour un trajet
     */
    @GetMapping("/trajet")
    public ResponseEntity<Response> getArriveesByDepartAndVilleArrivee(
            @RequestParam("departUuid") String departUuid,
            @RequestParam("villeArriveeUuid") String villeArriveeUuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/arrivees/trajet - Départ: {} vers Ville: {}", departUuid, villeArriveeUuid);
        List<Arrivee> arrivees = arriveeService.getArriveesByDepartAndVilleArrivee(departUuid, villeArriveeUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("arrivees", arrivees), "Arrivées du trajet récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/arrivees/search?q=xxx - Rechercher des arrivées
     */
    @GetMapping("/search")
    public ResponseEntity<Response> searchArrivees(
            @RequestParam("q") String searchTerm,
            HttpServletRequest request) {
        log.info("GET /billetterie/arrivees/search?q={} - Recherche", searchTerm);
        List<Arrivee> arrivees = arriveeService.searchArrivees(searchTerm);
        return ResponseEntity.ok(
                getResponse(request, Map.of("arrivees", arrivees), "Recherche effectuée avec succès", OK)
        );
    }

    /**
     * POST /billetterie/arrivees - Créer une nouvelle arrivée
     */
    @PostMapping
    public ResponseEntity<Response> createArrivee(
            @Valid @RequestBody ArriveeRequest arriveeRequest,
            HttpServletRequest request) {
        log.info("POST /billetterie/arrivees - Création d'une arrivée: {}", arriveeRequest.getLibelle());

        Arrivee arrivee = Arrivee.builder()
                .libelle(arriveeRequest.getLibelle())
                .libelleDepart(arriveeRequest.getLibelleDepart())
                .description(arriveeRequest.getDescription())
                .ordreAffichage(arriveeRequest.getOrdreAffichage())
                .actif(arriveeRequest.getActif() != null ? arriveeRequest.getActif() : true)
                .build();

        Arrivee createdArrivee = arriveeService.createArrivee(arrivee,
                arriveeRequest.getSiteUuid(),
                arriveeRequest.getDepartUuid());

        return ResponseEntity.status(CREATED).body(
                getResponse(request, Map.of("arrivee", createdArrivee), "Arrivée créée avec succès", CREATED)
        );
    }

    /**
     * PUT /billetterie/arrivees/{uuid} - Mettre à jour une arrivée
     */
    @PutMapping("/{uuid}")
    public ResponseEntity<Response> updateArrivee(
            @PathVariable(name = "uuid") String uuid,
            @Valid @RequestBody ArriveeRequest arriveeRequest,
            HttpServletRequest request) {
        log.info("PUT /billetterie/arrivees/{} - Mise à jour de l'arrivée", uuid);

        Arrivee arrivee = Arrivee.builder()
                .libelle(arriveeRequest.getLibelle())
                .libelleDepart(arriveeRequest.getLibelleDepart())
                .description(arriveeRequest.getDescription())
                .ordreAffichage(arriveeRequest.getOrdreAffichage())
                .actif(arriveeRequest.getActif())
                .build();

        Arrivee updatedArrivee = arriveeService.updateArrivee(uuid, arrivee,
                arriveeRequest.getSiteUuid(),
                arriveeRequest.getDepartUuid());

        return ResponseEntity.ok(
                getResponse(request, Map.of("arrivee", updatedArrivee), "Arrivée mise à jour avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/arrivees/{uuid}/toggle-actif - Basculer le statut actif
     */
    @PatchMapping("/{uuid}/toggle-actif")
    public ResponseEntity<Response> toggleActif(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/arrivees/{}/toggle-actif - Basculement du statut", uuid);
        Arrivee arrivee = arriveeService.toggleActif(uuid);
        String message = arrivee.getActif() ? "Arrivée activée avec succès" : "Arrivée désactivée avec succès";
        return ResponseEntity.ok(
                getResponse(request, Map.of("arrivee", arrivee), message, OK)
        );
    }

    /**
     * DELETE /billetterie/arrivees/{uuid} - Supprimer une arrivée
     */
    @DeleteMapping("/{uuid}")
    public ResponseEntity<Response> deleteArrivee(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request) {
        log.info("DELETE /billetterie/arrivees/{} - Suppression de l'arrivée", uuid);
        arriveeService.deleteArrivee(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of(), "Arrivée supprimée avec succès", OK)
        );
    }
}
