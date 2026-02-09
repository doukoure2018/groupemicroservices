package io.multi.billetterieservice.resource;

import io.multi.billetterieservice.domain.Partenaire;
import io.multi.billetterieservice.domain.Response;
import io.multi.billetterieservice.dto.PartenaireRequest;
import io.multi.billetterieservice.service.PartenaireService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static io.multi.billetterieservice.utils.RequestUtils.getResponse;
import static org.springframework.http.HttpStatus.*;

/**
 * Contrôleur REST pour la gestion des partenaires.
 * Base path: /billetterie/partenaires
 */
@RestController
@RequestMapping("/billetterie/partenaires")
@RequiredArgsConstructor
@Slf4j
public class PartenaireResource {

    private final PartenaireService partenaireService;

    // ========== ENDPOINTS DE LECTURE ==========

    /**
     * GET /billetterie/partenaires - Liste tous les partenaires
     */
    @GetMapping
    public ResponseEntity<Response> getAll(HttpServletRequest request) {
        log.info("GET /billetterie/partenaires - Récupération de tous les partenaires");
        List<Partenaire> partenaires = partenaireService.getAll();
        return ResponseEntity.ok(
                getResponse(request, Map.of("partenaires", partenaires, "total", partenaires.size()),
                        "Partenaires récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/partenaires/actifs - Liste partenaires actifs
     */
    @GetMapping("/actifs")
    public ResponseEntity<Response> getAllActifs(HttpServletRequest request) {
        log.info("GET /billetterie/partenaires/actifs - Récupération des partenaires actifs");
        List<Partenaire> partenaires = partenaireService.getAllActifs();
        return ResponseEntity.ok(
                getResponse(request, Map.of("partenaires", partenaires, "total", partenaires.size()),
                        "Partenaires actifs récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/partenaires/{uuid} - Détail d'un partenaire
     */
    @GetMapping("/{uuid}")
    public ResponseEntity<Response> getByUuid(
            @PathVariable String uuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/partenaires/{} - Récupération du partenaire", uuid);
        Partenaire partenaire = partenaireService.getByUuid(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("partenaire", partenaire),
                        "Partenaire récupéré avec succès", OK)
        );
    }

    /**
     * GET /billetterie/partenaires/nom/{nom} - Par nom
     */
    @GetMapping("/nom/{nom}")
    public ResponseEntity<Response> getByNom(
            @PathVariable String nom,
            HttpServletRequest request) {
        log.info("GET /billetterie/partenaires/nom/{} - Récupération par nom", nom);
        Partenaire partenaire = partenaireService.getByNom(nom);
        return ResponseEntity.ok(
                getResponse(request, Map.of("partenaire", partenaire),
                        "Partenaire récupéré avec succès", OK)
        );
    }

    /**
     * GET /billetterie/partenaires/type/{typePartenaire} - Par type
     */
    @GetMapping("/type/{typePartenaire}")
    public ResponseEntity<Response> getByType(
            @PathVariable String typePartenaire,
            HttpServletRequest request) {
        log.info("GET /billetterie/partenaires/type/{}", typePartenaire);
        List<Partenaire> partenaires = partenaireService.getByType(typePartenaire);
        return ResponseEntity.ok(
                getResponse(request, Map.of("partenaires", partenaires, "total", partenaires.size()),
                        "Partenaires récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/partenaires/statut/{statut} - Par statut
     */
    @GetMapping("/statut/{statut}")
    public ResponseEntity<Response> getByStatut(
            @PathVariable String statut,
            HttpServletRequest request) {
        log.info("GET /billetterie/partenaires/statut/{}", statut);
        List<Partenaire> partenaires = partenaireService.getByStatut(statut);
        return ResponseEntity.ok(
                getResponse(request, Map.of("partenaires", partenaires, "total", partenaires.size()),
                        "Partenaires récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/partenaires/ville/{villeUuid} - Par ville
     */
    @GetMapping("/ville/{villeUuid}")
    public ResponseEntity<Response> getByVille(
            @PathVariable String villeUuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/partenaires/ville/{}", villeUuid);
        List<Partenaire> partenaires = partenaireService.getByVille(villeUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("partenaires", partenaires, "total", partenaires.size()),
                        "Partenaires récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/partenaires/region/{regionUuid} - Par région
     */
    @GetMapping("/region/{regionUuid}")
    public ResponseEntity<Response> getByRegion(
            @PathVariable String regionUuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/partenaires/region/{}", regionUuid);
        List<Partenaire> partenaires = partenaireService.getByRegion(regionUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("partenaires", partenaires, "total", partenaires.size()),
                        "Partenaires récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/partenaires/search?q=terme - Recherche
     */
    @GetMapping("/search")
    public ResponseEntity<Response> search(
            @RequestParam(name = "q") String searchTerm,
            HttpServletRequest request) {
        log.info("GET /billetterie/partenaires/search?q={}", searchTerm);
        List<Partenaire> partenaires = partenaireService.search(searchTerm);
        return ResponseEntity.ok(
                getResponse(request, Map.of("partenaires", partenaires, "total", partenaires.size()),
                        "Recherche effectuée avec succès", OK)
        );
    }

    /**
     * GET /billetterie/partenaires/expires - Partenariats expirés
     */
    @GetMapping("/expires")
    public ResponseEntity<Response> getPartenariatsExpires(HttpServletRequest request) {
        log.info("GET /billetterie/partenaires/expires");
        List<Partenaire> partenaires = partenaireService.getPartenariatsExpires();
        return ResponseEntity.ok(
                getResponse(request, Map.of("partenaires", partenaires, "total", partenaires.size()),
                        "Partenariats expirés récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/partenaires/expirant-bientot - Expirant bientôt (30 jours)
     */
    @GetMapping("/expirant-bientot")
    public ResponseEntity<Response> getPartenariatsExpirantBientot(HttpServletRequest request) {
        log.info("GET /billetterie/partenaires/expirant-bientot");
        List<Partenaire> partenaires = partenaireService.getPartenariatsExpirantBientot();
        return ResponseEntity.ok(
                getResponse(request, Map.of("partenaires", partenaires, "total", partenaires.size()),
                        "Partenariats expirant bientôt récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/partenaires/{uuid}/calculer-commission?montant=X - Calculer commission
     */
    @GetMapping("/{uuid}/calculer-commission")
    public ResponseEntity<Response> calculerCommission(
            @PathVariable String uuid,
            @RequestParam BigDecimal montant,
            HttpServletRequest request) {
        log.info("GET /billetterie/partenaires/{}/calculer-commission?montant={}", uuid, montant);
        BigDecimal commission = partenaireService.calculerCommission(uuid, montant);
        BigDecimal montantNet = montant.subtract(commission);
        return ResponseEntity.ok(
                getResponse(request, Map.of(
                        "montantBrut", montant,
                        "commission", commission,
                        "montantNet", montantNet
                ), "Commission calculée avec succès", OK)
        );
    }

    // ========== ENDPOINTS D'ÉCRITURE ==========

    /**
     * POST /billetterie/partenaires - Créer un partenaire
     */
    @PostMapping
    public ResponseEntity<Response> create(
            @Valid @RequestBody PartenaireRequest partenaireRequest,
            HttpServletRequest request) {
        log.info("POST /billetterie/partenaires - Création: {}", partenaireRequest.getNom());
        Partenaire partenaire = partenaireService.create(partenaireRequest);
        return ResponseEntity.status(CREATED).body(
                getResponse(request, Map.of("partenaire", partenaire),
                        "Partenaire créé avec succès", CREATED)
        );
    }

    /**
     * PUT /billetterie/partenaires/{uuid} - Mettre à jour
     */
    @PutMapping("/{uuid}")
    public ResponseEntity<Response> update(
            @PathVariable String uuid,
            @Valid @RequestBody PartenaireRequest partenaireRequest,
            HttpServletRequest request) {
        log.info("PUT /billetterie/partenaires/{}", uuid);
        Partenaire partenaire = partenaireService.update(uuid, partenaireRequest);
        return ResponseEntity.ok(
                getResponse(request, Map.of("partenaire", partenaire),
                        "Partenaire mis à jour avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/partenaires/{uuid}/statut - Changer le statut
     */
    @PatchMapping("/{uuid}/statut")
    public ResponseEntity<Response> updateStatut(
            @PathVariable String uuid,
            @RequestParam String statut,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/partenaires/{}/statut -> {}", uuid, statut);
        Partenaire partenaire = partenaireService.updateStatut(uuid, statut);
        return ResponseEntity.ok(
                getResponse(request, Map.of("partenaire", partenaire),
                        "Statut du partenaire mis à jour avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/partenaires/{uuid}/commissions - MAJ commissions
     */
    @PatchMapping("/{uuid}/commissions")
    public ResponseEntity<Response> updateCommissions(
            @PathVariable String uuid,
            @RequestParam(required = false) BigDecimal commissionPourcentage,
            @RequestParam(required = false) BigDecimal commissionFixe,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/partenaires/{}/commissions", uuid);
        Partenaire partenaire = partenaireService.updateCommissions(uuid, commissionPourcentage, commissionFixe);
        return ResponseEntity.ok(
                getResponse(request, Map.of("partenaire", partenaire),
                        "Commissions mises à jour avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/partenaires/{uuid}/activer - Activer
     */
    @PatchMapping("/{uuid}/activer")
    public ResponseEntity<Response> activer(
            @PathVariable String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/partenaires/{}/activer", uuid);
        Partenaire partenaire = partenaireService.activer(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("partenaire", partenaire),
                        "Partenaire activé avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/partenaires/{uuid}/desactiver - Désactiver
     */
    @PatchMapping("/{uuid}/desactiver")
    public ResponseEntity<Response> desactiver(
            @PathVariable String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/partenaires/{}/desactiver", uuid);
        Partenaire partenaire = partenaireService.desactiver(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("partenaire", partenaire),
                        "Partenaire désactivé avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/partenaires/{uuid}/suspendre - Suspendre
     */
    @PatchMapping("/{uuid}/suspendre")
    public ResponseEntity<Response> suspendre(
            @PathVariable String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/partenaires/{}/suspendre", uuid);
        Partenaire partenaire = partenaireService.suspendre(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("partenaire", partenaire),
                        "Partenaire suspendu avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/partenaires/{uuid}/en-attente - Mettre en attente
     */
    @PatchMapping("/{uuid}/en-attente")
    public ResponseEntity<Response> mettreEnAttente(
            @PathVariable String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/partenaires/{}/en-attente", uuid);
        Partenaire partenaire = partenaireService.mettreEnAttente(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("partenaire", partenaire),
                        "Partenaire mis en attente avec succès", OK)
        );
    }

    /**
     * DELETE /billetterie/partenaires/{uuid} - Supprimer
     */
    @DeleteMapping("/{uuid}")
    public ResponseEntity<Response> delete(
            @PathVariable String uuid,
            HttpServletRequest request) {
        log.info("DELETE /billetterie/partenaires/{}", uuid);
        partenaireService.delete(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of(), "Partenaire supprimé avec succès", OK)
        );
    }

    // ========== ENDPOINTS STATISTIQUES ==========

    /**
     * GET /billetterie/partenaires/stats - Statistiques
     */
    @GetMapping("/stats")
    public ResponseEntity<Response> getStats(HttpServletRequest request) {
        log.info("GET /billetterie/partenaires/stats");
        long total = partenaireService.count();
        long actifs = partenaireService.countByStatut("ACTIF");
        long inactifs = partenaireService.countByStatut("INACTIF");
        long suspendus = partenaireService.countByStatut("SUSPENDU");
        long enAttente = partenaireService.countByStatut("EN_ATTENTE");

        return ResponseEntity.ok(
                getResponse(request, Map.of(
                        "total", total,
                        "actifs", actifs,
                        "inactifs", inactifs,
                        "suspendus", suspendus,
                        "enAttente", enAttente
                ), "Statistiques récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/partenaires/stats/types - Statistiques par type
     */
    @GetMapping("/stats/types")
    public ResponseEntity<Response> getStatsByType(HttpServletRequest request) {
        log.info("GET /billetterie/partenaires/stats/types");
        long agences = partenaireService.countByType("AGENCE");
        long transporteurs = partenaireService.countByType("TRANSPORTEUR");
        long revendeurs = partenaireService.countByType("REVENDEUR");
        long guichets = partenaireService.countByType("GUICHET");
        long autres = partenaireService.countByType("AUTRE");

        return ResponseEntity.ok(
                getResponse(request, Map.of(
                        "agences", agences,
                        "transporteurs", transporteurs,
                        "revendeurs", revendeurs,
                        "guichets", guichets,
                        "autres", autres
                ), "Statistiques par type récupérées avec succès", OK)
        );
    }
}