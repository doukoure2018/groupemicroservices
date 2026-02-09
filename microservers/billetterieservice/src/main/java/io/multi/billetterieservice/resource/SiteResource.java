package io.multi.billetterieservice.resource;


import io.multi.billetterieservice.domain.Response;
import io.multi.billetterieservice.domain.Site;
import io.multi.billetterieservice.dto.SiteRequest;
import io.multi.billetterieservice.service.SiteService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import static io.multi.billetterieservice.utils.RequestUtils.getResponse;
import static org.springframework.http.HttpStatus.*;

@RestController
@RequestMapping("/billetterie/sites")
@RequiredArgsConstructor
@Slf4j
public class SiteResource {

    private final SiteService siteService;

    /**
     * GET /billetterie/sites - Récupérer tous les sites
     */
    @GetMapping
    public ResponseEntity<Response> getAllSites(HttpServletRequest request) {
        log.info("GET /billetterie/sites - Récupération de tous les sites");
        List<Site> sites = siteService.getAllSites();
        return ResponseEntity.ok(
                getResponse(request, Map.of("sites", sites), "Sites récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/sites/actifs - Récupérer tous les sites actifs
     */
    @GetMapping("/actifs")
    public ResponseEntity<Response> getAllSitesActifs(HttpServletRequest request) {
        log.info("GET /billetterie/sites/actifs - Récupération des sites actifs");
        List<Site> sites = siteService.getAllSitesActifs();
        return ResponseEntity.ok(
                getResponse(request, Map.of("sites", sites), "Sites actifs récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/sites/{uuid} - Récupérer un site par UUID
     */
    @GetMapping("/{uuid}")
    public ResponseEntity<Response> getSiteByUuid(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request)
    {
        log.info("GET /billetterie/sites/{} - Récupération du site", uuid);
        Site site = siteService.getSiteByUuid(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("site", site), "Site récupéré avec succès", OK)
        );
    }

    /**
     * GET /billetterie/sites/type/{typeSite} - Récupérer les sites par type
     */
    @GetMapping("/type/{typeSite}")
    public ResponseEntity<Response> getSitesByType(
            @PathVariable(name = "typeSite") String typeSite,
            HttpServletRequest request) {
        log.info("GET /billetterie/sites/type/{} - Récupération par type", typeSite);
        List<Site> sites = siteService.getSitesByTypeSite(typeSite);
        return ResponseEntity.ok(
                getResponse(request, Map.of("sites", sites), "Sites récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/sites/localisation/{localisationUuid} - Récupérer les sites par localisation
     */
    @GetMapping("/localisation/{localisationUuid}")
    public ResponseEntity<Response> getSitesByLocalisation(
            @PathVariable(name = "localisationUuid") String localisationUuid,
            HttpServletRequest request)
    {
        log.info("GET /billetterie/sites/localisation/{} - Récupération par localisation", localisationUuid);
        List<Site> sites = siteService.getSitesByLocalisation(localisationUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("sites", sites), "Sites récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/sites/ville/{villeUuid} - Récupérer les sites par ville
     */
    @GetMapping("/ville/{villeUuid}")
    public ResponseEntity<Response> getSitesByVille(
            @PathVariable(name = "villeUuid") String villeUuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/sites/ville/{} - Récupération par ville", villeUuid);
        List<Site> sites = siteService.getSitesByVille(villeUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("sites", sites), "Sites récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/sites/commune/{communeUuid} - Récupérer les sites par commune
     */
    @GetMapping("/commune/{communeUuid}")
    public ResponseEntity<Response> getSitesByCommune(
            @PathVariable(name = "communeUuid") String communeUuid,
            HttpServletRequest request)
    {
        log.info("GET /billetterie/sites/commune/{} - Récupération par commune", communeUuid);
        List<Site> sites = siteService.getSitesByCommune(communeUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("sites", sites), "Sites récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/sites/search?q=xxx - Rechercher des sites
     */
    @GetMapping("/search")
    public ResponseEntity<Response> searchSites(
            @RequestParam("q") String searchTerm,
            HttpServletRequest request)
    {
        log.info("GET /billetterie/sites/search?q={} - Recherche", searchTerm);
        List<Site> sites = siteService.searchSites(searchTerm);
        return ResponseEntity.ok(
                getResponse(request, Map.of("sites", sites), "Recherche effectuée avec succès", OK)
        );
    }

    /**
     * POST /billetterie/sites - Créer un nouveau site
     */
    @PostMapping
    public ResponseEntity<Response> createSite(
            @Valid @RequestBody SiteRequest siteRequest,
            HttpServletRequest request) {
        log.info("POST /billetterie/sites - Création d'un site: {}", siteRequest.getNom());

        Site site = Site.builder()
                .nom(siteRequest.getNom())
                .description(siteRequest.getDescription())
                .typeSite(siteRequest.getTypeSite())
                .capaciteVehicules(siteRequest.getCapaciteVehicules())
                .telephone(siteRequest.getTelephone())
                .email(siteRequest.getEmail())
                .horaireOuverture(siteRequest.getHoraireOuverture())
                .horaireFermeture(siteRequest.getHoraireFermeture())
                .imageUrl(siteRequest.getImageUrl())
                .actif(siteRequest.getActif() != null ? siteRequest.getActif() : true)
                .build();

        Site createdSite = siteService.createSite(site, siteRequest.getLocalisationUuid());

        return ResponseEntity.status(CREATED).body(
                getResponse(request, Map.of("site", createdSite), "Site créé avec succès", CREATED)
        );
    }

    /**
     * PUT /billetterie/sites/{uuid} - Mettre à jour un site
     */
    @PutMapping("/{uuid}")
    public ResponseEntity<Response> updateSite(
            @PathVariable(name = "uuid") String uuid,
            @Valid @RequestBody SiteRequest siteRequest,
            HttpServletRequest request) {
        log.info("PUT /billetterie/sites/{} - Mise à jour du site", uuid);

        Site site = Site.builder()
                .nom(siteRequest.getNom())
                .description(siteRequest.getDescription())
                .typeSite(siteRequest.getTypeSite())
                .capaciteVehicules(siteRequest.getCapaciteVehicules())
                .telephone(siteRequest.getTelephone())
                .email(siteRequest.getEmail())
                .horaireOuverture(siteRequest.getHoraireOuverture())
                .horaireFermeture(siteRequest.getHoraireFermeture())
                .imageUrl(siteRequest.getImageUrl())
                .actif(siteRequest.getActif())
                .build();

        Site updatedSite = siteService.updateSite(uuid, site, siteRequest.getLocalisationUuid());

        return ResponseEntity.ok(
                getResponse(request, Map.of("site", updatedSite), "Site mis à jour avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/sites/{uuid}/toggle-actif - Basculer le statut actif
     */
    @PatchMapping("/{uuid}/toggle-actif")
    public ResponseEntity<Response> toggleActif(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/sites/{}/toggle-actif - Basculement du statut", uuid);
        Site site = siteService.toggleActif(uuid);
        String message = site.getActif() ? "Site activé avec succès" : "Site désactivé avec succès";
        return ResponseEntity.ok(
                getResponse(request, Map.of("site", site), message, OK)
        );
    }

    /**
     * DELETE /billetterie/sites/{uuid} - Supprimer un site
     */
    @DeleteMapping("/{uuid}")
    public ResponseEntity<Response> deleteSite(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request) {
        log.info("DELETE /billetterie/sites/{} - Suppression du site", uuid);
        siteService.deleteSite(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of(), "Site supprimé avec succès", OK)
        );
    }
}