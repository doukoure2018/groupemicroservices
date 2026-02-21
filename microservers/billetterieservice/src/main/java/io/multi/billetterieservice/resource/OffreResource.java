package io.multi.billetterieservice.resource;

import io.multi.billetterieservice.domain.Avis;
import io.multi.billetterieservice.domain.Offre;
import io.multi.billetterieservice.domain.Response;
import io.multi.billetterieservice.dto.OffreRequest;
import io.multi.billetterieservice.repository.AvisRepository;
import io.multi.billetterieservice.service.OffreService;
import io.multi.billetterieservice.utils.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static io.multi.billetterieservice.utils.RequestUtils.getResponse;
import static org.springframework.http.HttpStatus.*;

/**
 * Contrôleur REST pour la gestion des offres de transport.
 * Base path: /billetterie/offres
 */
@RestController
@RequestMapping("/billetterie/offres")
@RequiredArgsConstructor
@Slf4j
public class OffreResource {

    private final OffreService offreService;
    private final AvisRepository avisRepository;
    private final JwtUtils jwtUtils;

    // ========== ENDPOINTS DE LECTURE ==========

    /**
     * GET /billetterie/offres - Liste toutes les offres
     */
    @GetMapping
    public ResponseEntity<Response> getAll(HttpServletRequest request) {
        log.info("GET /billetterie/offres - Récupération de toutes les offres");
        List<Offre> offres = offreService.getAll();
        return ResponseEntity.ok(
                getResponse(request, Map.of("offres", offres, "total", offres.size()),
                        "Offres récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/offres/ouvertes - Liste offres ouvertes
     */
    @GetMapping("/ouvertes")
    public ResponseEntity<Response> getAllOuvertes(HttpServletRequest request) {
        log.info("GET /billetterie/offres/ouvertes - Récupération des offres ouvertes");
        List<Offre> offres = offreService.getAllOuvertes();
        return ResponseEntity.ok(
                getResponse(request, Map.of("offres", offres, "total", offres.size()),
                        "Offres ouvertes récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/offres/{uuid} - Détail d'une offre
     */
    @GetMapping("/{uuid}")
    public ResponseEntity<Response> getByUuid(
            @PathVariable String uuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/offres/{} - Récupération de l'offre", uuid);
        Offre offre = offreService.getByUuid(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("offre", offre),
                        "Offre récupérée avec succès", OK)
        );
    }

    /**
     * GET /billetterie/offres/token/{token} - Par token
     */
    @GetMapping("/token/{token}")
    public ResponseEntity<Response> getByToken(
            @PathVariable String token,
            HttpServletRequest request) {
        log.info("GET /billetterie/offres/token/{}", token);
        Offre offre = offreService.getByToken(token);
        return ResponseEntity.ok(
                getResponse(request, Map.of("offre", offre),
                        "Offre récupérée avec succès", OK)
        );
    }

    /**
     * GET /billetterie/offres/mes-offres - Offres de l'utilisateur connecté
     */
    @GetMapping("/mes-offres")
    public ResponseEntity<Response> getMesOffres(
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {
        Long userId = extractUserId(jwt);
        log.info("GET /billetterie/offres/mes-offres - userId: {}", userId);
        List<Offre> offres = offreService.getMesOffres(userId);
        return ResponseEntity.ok(
                getResponse(request, Map.of("offres", offres, "total", offres.size()),
                        "Mes offres récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/offres/trajet/{trajetUuid} - Par trajet
     */
    @GetMapping("/trajet/{trajetUuid}")
    public ResponseEntity<Response> getByTrajet(
            @PathVariable String trajetUuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/offres/trajet/{}", trajetUuid);
        List<Offre> offres = offreService.getByTrajet(trajetUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("offres", offres, "total", offres.size()),
                        "Offres récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/offres/vehicule/{vehiculeUuid} - Par véhicule
     */
    @GetMapping("/vehicule/{vehiculeUuid}")
    public ResponseEntity<Response> getByVehicule(
            @PathVariable String vehiculeUuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/offres/vehicule/{}", vehiculeUuid);
        List<Offre> offres = offreService.getByVehicule(vehiculeUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("offres", offres, "total", offres.size()),
                        "Offres récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/offres/statut/{statut} - Par statut
     */
    @GetMapping("/statut/{statut}")
    public ResponseEntity<Response> getByStatut(
            @PathVariable String statut,
            HttpServletRequest request) {
        log.info("GET /billetterie/offres/statut/{}", statut);
        List<Offre> offres = offreService.getByStatut(statut);
        return ResponseEntity.ok(
                getResponse(request, Map.of("offres", offres, "total", offres.size()),
                        "Offres récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/offres/date/{dateDepart} - Par date de départ
     */
    @GetMapping("/date/{dateDepart}")
    public ResponseEntity<Response> getByDateDepart(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDepart,
            HttpServletRequest request) {
        log.info("GET /billetterie/offres/date/{}", dateDepart);
        List<Offre> offres = offreService.getByDateDepart(dateDepart);
        return ResponseEntity.ok(
                getResponse(request, Map.of("offres", offres, "total", offres.size()),
                        "Offres récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/offres/recherche - Recherche entre villes
     */
    @GetMapping("/recherche")
    public ResponseEntity<Response> rechercher(
            @RequestParam String villeDepartUuid,
            @RequestParam String villeArriveeUuid,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDepart,
            HttpServletRequest request) {
        log.info("GET /billetterie/offres/recherche - {} -> {} le {}", villeDepartUuid, villeArriveeUuid, dateDepart);

        List<Offre> offres;
        if (dateDepart != null) {
            offres = offreService.getByVillesAndDate(villeDepartUuid, villeArriveeUuid, dateDepart);
        } else {
            offres = offreService.getByVilles(villeDepartUuid, villeArriveeUuid);
        }

        return ResponseEntity.ok(
                getResponse(request, Map.of("offres", offres, "total", offres.size()),
                        "Recherche effectuée avec succès", OK)
        );
    }

    /**
     * GET /billetterie/offres/ville-depart/{villeUuid} - Par ville de départ
     */
    @GetMapping("/ville-depart/{villeUuid}")
    public ResponseEntity<Response> getByVilleDepart(
            @PathVariable String villeUuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/offres/ville-depart/{}", villeUuid);
        List<Offre> offres = offreService.getByVilleDepart(villeUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("offres", offres, "total", offres.size()),
                        "Offres récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/offres/ville-arrivee/{villeUuid} - Par ville d'arrivée
     */
    @GetMapping("/ville-arrivee/{villeUuid}")
    public ResponseEntity<Response> getByVilleArrivee(
            @PathVariable String villeUuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/offres/ville-arrivee/{}", villeUuid);
        List<Offre> offres = offreService.getByVilleArrivee(villeUuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("offres", offres, "total", offres.size()),
                        "Offres récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/offres/places-disponibles/{nombrePlaces} - Avec places disponibles
     */
    @GetMapping("/places-disponibles/{nombrePlaces}")
    public ResponseEntity<Response> getAvecPlacesDisponibles(
            @PathVariable int nombrePlaces,
            HttpServletRequest request) {
        log.info("GET /billetterie/offres/places-disponibles/{}", nombrePlaces);
        List<Offre> offres = offreService.getAvecPlacesDisponibles(nombrePlaces);
        return ResponseEntity.ok(
                getResponse(request, Map.of("offres", offres, "total", offres.size()),
                        "Offres récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/offres/aujourd-hui - Offres du jour
     */
    @GetMapping("/aujourd-hui")
    public ResponseEntity<Response> getAujourdHui(HttpServletRequest request) {
        log.info("GET /billetterie/offres/aujourd-hui");
        List<Offre> offres = offreService.getAujourdHui();
        return ResponseEntity.ok(
                getResponse(request, Map.of("offres", offres, "total", offres.size()),
                        "Offres d'aujourd'hui récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/offres/a-venir - Offres à venir
     */
    @GetMapping("/a-venir")
    public ResponseEntity<Response> getAVenir(HttpServletRequest request) {
        log.info("GET /billetterie/offres/a-venir");
        List<Offre> offres = offreService.getAVenir();
        return ResponseEntity.ok(
                getResponse(request, Map.of("offres", offres, "total", offres.size()),
                        "Offres à venir récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/offres/passees - Offres passées
     */
    @GetMapping("/passees")
    public ResponseEntity<Response> getPassees(HttpServletRequest request) {
        log.info("GET /billetterie/offres/passees");
        List<Offre> offres = offreService.getPassees();
        return ResponseEntity.ok(
                getResponse(request, Map.of("offres", offres, "total", offres.size()),
                        "Offres passées récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/offres/promotions - Offres en promotion
     */
    @GetMapping("/promotions")
    public ResponseEntity<Response> getEnPromotion(HttpServletRequest request) {
        log.info("GET /billetterie/offres/promotions");
        List<Offre> offres = offreService.getEnPromotion();
        return ResponseEntity.ok(
                getResponse(request, Map.of("offres", offres, "total", offres.size()),
                        "Offres en promotion récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/offres/search?q=terme - Recherche textuelle
     */
    @GetMapping("/search")
    public ResponseEntity<Response> search(
            @RequestParam(name = "q") String searchTerm,
            HttpServletRequest request) {
        log.info("GET /billetterie/offres/search?q={}", searchTerm);
        List<Offre> offres = offreService.search(searchTerm);
        return ResponseEntity.ok(
                getResponse(request, Map.of("offres", offres, "total", offres.size()),
                        "Recherche effectuée avec succès", OK)
        );
    }

    // ========== ENDPOINTS D'ÉCRITURE ==========

    /**
     * POST /billetterie/offres - Créer une offre
     */
    @PostMapping
    public ResponseEntity<Response> create(
            @Valid @RequestBody OffreRequest offreRequest,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {
        Long userId = extractUserId(jwt);
        log.info("POST /billetterie/offres - Création par userId: {}", userId);
        Offre offre = offreService.create(offreRequest, userId);
        return ResponseEntity.status(CREATED).body(
                getResponse(request, Map.of("offre", offre),
                        "Offre créée avec succès", CREATED)
        );
    }

    /**
     * PUT /billetterie/offres/{uuid} - Mettre à jour
     */
    @PutMapping("/{uuid}")
    public ResponseEntity<Response> update(
            @PathVariable String uuid,
            @Valid @RequestBody OffreRequest offreRequest,
            HttpServletRequest request) {
        log.info("PUT /billetterie/offres/{}", uuid);
        Offre offre = offreService.update(uuid, offreRequest);
        return ResponseEntity.ok(
                getResponse(request, Map.of("offre", offre),
                        "Offre mise à jour avec succès", OK)
        );
    }

    // ========== ENDPOINTS DE GESTION DES STATUTS ==========

    /**
     * PATCH /billetterie/offres/{uuid}/ouvrir - Ouvrir
     */
    @PatchMapping("/{uuid}/ouvrir")
    public ResponseEntity<Response> ouvrir(
            @PathVariable String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/offres/{}/ouvrir", uuid);
        Offre offre = offreService.ouvrir(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("offre", offre),
                        "Offre ouverte avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/offres/{uuid}/fermer - Fermer
     */
    @PatchMapping("/{uuid}/fermer")
    public ResponseEntity<Response> fermer(
            @PathVariable String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/offres/{}/fermer", uuid);
        Offre offre = offreService.fermer(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("offre", offre),
                        "Offre fermée avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/offres/{uuid}/cloturer - Clôturer
     */
    @PatchMapping("/{uuid}/cloturer")
    public ResponseEntity<Response> cloturer(
            @PathVariable String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/offres/{}/cloturer", uuid);
        Offre offre = offreService.cloturer(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("offre", offre),
                        "Offre clôturée avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/offres/{uuid}/annuler - Annuler
     */
    @PatchMapping("/{uuid}/annuler")
    public ResponseEntity<Response> annuler(
            @PathVariable String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/offres/{}/annuler", uuid);
        Offre offre = offreService.annuler(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("offre", offre),
                        "Offre annulée avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/offres/{uuid}/demarrer - Démarrer le voyage
     */
    @PatchMapping("/{uuid}/demarrer")
    public ResponseEntity<Response> demarrer(
            @PathVariable String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/offres/{}/demarrer", uuid);
        Offre offre = offreService.demarrer(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("offre", offre),
                        "Voyage démarré avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/offres/{uuid}/terminer - Terminer le voyage
     */
    @PatchMapping("/{uuid}/terminer")
    public ResponseEntity<Response> terminer(
            @PathVariable String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/offres/{}/terminer", uuid);
        Offre offre = offreService.terminer(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("offre", offre),
                        "Voyage terminé avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/offres/{uuid}/suspendre - Suspendre
     */
    @PatchMapping("/{uuid}/suspendre")
    public ResponseEntity<Response> suspendre(
            @PathVariable String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/offres/{}/suspendre", uuid);
        Offre offre = offreService.suspendre(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("offre", offre),
                        "Offre suspendue avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/offres/{uuid}/reprendre - Reprendre
     */
    @PatchMapping("/{uuid}/reprendre")
    public ResponseEntity<Response> reprendre(
            @PathVariable String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/offres/{}/reprendre", uuid);
        Offre offre = offreService.reprendre(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("offre", offre),
                        "Offre reprise avec succès", OK)
        );
    }

    // ========== ENDPOINTS DE GESTION DES PROMOTIONS ==========

    /**
     * PATCH /billetterie/offres/{uuid}/promotion - Appliquer une promotion
     */
    @PatchMapping("/{uuid}/promotion")
    public ResponseEntity<Response> appliquerPromotion(
            @PathVariable String uuid,
            @RequestParam BigDecimal montantPromotion,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/offres/{}/promotion -> {}", uuid, montantPromotion);
        Offre offre = offreService.appliquerPromotion(uuid, montantPromotion);
        return ResponseEntity.ok(
                getResponse(request, Map.of("offre", offre),
                        "Promotion appliquée avec succès", OK)
        );
    }

    /**
     * DELETE /billetterie/offres/{uuid}/promotion - Supprimer la promotion
     */
    @DeleteMapping("/{uuid}/promotion")
    public ResponseEntity<Response> supprimerPromotion(
            @PathVariable String uuid,
            HttpServletRequest request) {
        log.info("DELETE /billetterie/offres/{}/promotion", uuid);
        Offre offre = offreService.supprimerPromotion(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("offre", offre),
                        "Promotion supprimée avec succès", OK)
        );
    }

    // ========== ENDPOINTS DE SUPPRESSION ==========

    /**
     * DELETE /billetterie/offres/{uuid} - Supprimer
     */
    @DeleteMapping("/{uuid}")
    public ResponseEntity<Response> delete(
            @PathVariable String uuid,
            HttpServletRequest request) {
        log.info("DELETE /billetterie/offres/{}", uuid);
        offreService.delete(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of(), "Offre supprimée avec succès", OK)
        );
    }

    // ========== ENDPOINTS STATISTIQUES ==========

    /**
     * GET /billetterie/offres/stats - Statistiques globales
     */
    @GetMapping("/stats")
    public ResponseEntity<Response> getStats(HttpServletRequest request) {
        log.info("GET /billetterie/offres/stats");
        long total = offreService.count();
        long enAttente = offreService.countByStatut("EN_ATTENTE");
        long ouvertes = offreService.countByStatut("OUVERT");
        long fermees = offreService.countByStatut("FERME");
        long enCours = offreService.countByStatut("EN_COURS");
        long terminees = offreService.countByStatut("TERMINE");
        long annulees = offreService.countByStatut("ANNULE");
        long aujourdHui = offreService.countAujourdHui();

        return ResponseEntity.ok(
                getResponse(request, Map.of(
                        "total", total,
                        "enAttente", enAttente,
                        "ouvertes", ouvertes,
                        "fermees", fermees,
                        "enCours", enCours,
                        "terminees", terminees,
                        "annulees", annulees,
                        "aujourdHui", aujourdHui
                ), "Statistiques récupérées avec succès", OK)
        );
    }

    /**
     * GET /billetterie/offres/mes-stats - Statistiques de l'utilisateur
     */
    @GetMapping("/mes-stats")
    public ResponseEntity<Response> getMesStats(
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {
        Long userId = extractUserId(jwt);
        log.info("GET /billetterie/offres/mes-stats - userId: {}", userId);
        long total = offreService.countByUser(userId);
        return ResponseEntity.ok(
                getResponse(request, Map.of("total", total),
                        "Statistiques récupérées avec succès", OK)
        );
    }

    // ========== ENDPOINT AVIS ==========

    /**
     * GET /billetterie/offres/{uuid}/avis - Avis voyageurs pour le véhicule de cette offre
     */
    @GetMapping("/{uuid}/avis")
    public ResponseEntity<Response> getAvisByOffre(
            @PathVariable String uuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/offres/{}/avis", uuid);
        List<Avis> avis = avisRepository.findByOffreUuid(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("avis", avis, "total", avis.size()),
                        "Avis récupérés avec succès", OK)
        );
    }

    // ========== MÉTHODES PRIVÉES ==========

    private Long extractUserId(Jwt jwt) {
        return jwtUtils.extractUserId(jwt);
    }
}