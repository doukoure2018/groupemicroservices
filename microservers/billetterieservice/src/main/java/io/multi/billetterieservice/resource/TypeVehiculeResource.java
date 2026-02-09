package io.multi.billetterieservice.resource;

import io.multi.billetterieservice.domain.Response;
import io.multi.billetterieservice.domain.TypeVehicule;
import io.multi.billetterieservice.dto.TypeVehiculeRequest;
import io.multi.billetterieservice.service.TypeVehiculeService;
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
 * Contrôleur REST pour la gestion des types de véhicules.
 * Base path: /billetterie/types-vehicules
 */
@RestController
@RequestMapping("/billetterie/types-vehicules")
@RequiredArgsConstructor
@Slf4j
public class TypeVehiculeResource {

    private final TypeVehiculeService typeVehiculeService;

    // ========== ENDPOINTS DE LECTURE ==========

    /**
     * GET /billetterie/types-vehicules - Liste tous les types
     */
    @GetMapping
    public ResponseEntity<Response> getAll(HttpServletRequest request) {
        log.info("GET /billetterie/types-vehicules - Récupération de tous les types");
        List<TypeVehicule> types = typeVehiculeService.getAll();
        return ResponseEntity.ok(
                getResponse(request, Map.of("typesVehicules", types, "total", types.size()),
                        "Types de véhicules récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/types-vehicules/actifs - Liste types actifs
     */
    @GetMapping("/actifs")
    public ResponseEntity<Response> getAllActifs(HttpServletRequest request) {
        log.info("GET /billetterie/types-vehicules/actifs - Récupération des types actifs");
        List<TypeVehicule> types = typeVehiculeService.getAllActifs();
        return ResponseEntity.ok(
                getResponse(request, Map.of("typesVehicules", types, "total", types.size()),
                        "Types de véhicules actifs récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/types-vehicules/{uuid} - Détail d'un type
     */
    @GetMapping("/{uuid}")
    public ResponseEntity<Response> getByUuid(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/types-vehicules/{} - Récupération du type", uuid);
        TypeVehicule typeVehicule = typeVehiculeService.getByUuid(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("typeVehicule", typeVehicule),
                        "Type de véhicule récupéré avec succès", OK)
        );
    }

    /**
     * GET /billetterie/types-vehicules/libelle/{libelle} - Par libellé
     */
    @GetMapping("/libelle/{libelle}")
    public ResponseEntity<Response> getByLibelle(
            @PathVariable(name = "libelle") String libelle,
            HttpServletRequest request) {
        log.info("GET /billetterie/types-vehicules/libelle/{} - Récupération par libellé", libelle);
        TypeVehicule typeVehicule = typeVehiculeService.getByLibelle(libelle);
        return ResponseEntity.ok(
                getResponse(request, Map.of("typeVehicule", typeVehicule),
                        "Type de véhicule récupéré avec succès", OK)
        );
    }

    /**
     * GET /billetterie/types-vehicules/search?q=terme - Recherche
     */
    @GetMapping("/search")
    public ResponseEntity<Response> search(
            @RequestParam(name = "q") String searchTerm,
            HttpServletRequest request) {
        log.info("GET /billetterie/types-vehicules/search?q={} - Recherche", searchTerm);
        List<TypeVehicule> types = typeVehiculeService.search(searchTerm);
        return ResponseEntity.ok(
                getResponse(request, Map.of("typesVehicules", types, "total", types.size()),
                        "Recherche effectuée avec succès", OK)
        );
    }

    /**
     * GET /billetterie/types-vehicules/capacite/{capacite} - Par capacité
     */
    @GetMapping("/capacite/{capacite}")
    public ResponseEntity<Response> getByCapacite(
            @PathVariable(name = "capacite") int capacite,
            HttpServletRequest request) {
        log.info("GET /billetterie/types-vehicules/capacite/{} - Récupération par capacité", capacite);
        List<TypeVehicule> types = typeVehiculeService.getByCapacite(capacite);
        return ResponseEntity.ok(
                getResponse(request, Map.of("typesVehicules", types, "total", types.size()),
                        "Types de véhicules récupérés avec succès", OK)
        );
    }

    // ========== ENDPOINTS D'ÉCRITURE ==========

    /**
     * POST /billetterie/types-vehicules - Créer un type
     */
    @PostMapping
    public ResponseEntity<Response> create(
            @Valid @RequestBody TypeVehiculeRequest typeVehiculeRequest,
            HttpServletRequest request) {
        log.info("POST /billetterie/types-vehicules - Création: {}", typeVehiculeRequest.getLibelle());
        TypeVehicule typeVehicule = typeVehiculeService.create(typeVehiculeRequest);
        return ResponseEntity.status(CREATED).body(
                getResponse(request, Map.of("typeVehicule", typeVehicule),
                        "Type de véhicule créé avec succès", CREATED)
        );
    }

    /**
     * PUT /billetterie/types-vehicules/{uuid} - Mettre à jour
     */
    @PutMapping("/{uuid}")
    public ResponseEntity<Response> update(
            @PathVariable(name = "uuid") String uuid,
            @Valid @RequestBody TypeVehiculeRequest typeVehiculeRequest,
            HttpServletRequest request) {
        log.info("PUT /billetterie/types-vehicules/{} - Mise à jour", uuid);
        TypeVehicule typeVehicule = typeVehiculeService.update(uuid, typeVehiculeRequest);
        return ResponseEntity.ok(
                getResponse(request, Map.of("typeVehicule", typeVehicule),
                        "Type de véhicule mis à jour avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/types-vehicules/{uuid}/activer - Activer
     */
    @PatchMapping("/{uuid}/activer")
    public ResponseEntity<Response> activate(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/types-vehicules/{}/activer", uuid);
        TypeVehicule typeVehicule = typeVehiculeService.activate(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("typeVehicule", typeVehicule),
                        "Type de véhicule activé avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/types-vehicules/{uuid}/desactiver - Désactiver
     */
    @PatchMapping("/{uuid}/desactiver")
    public ResponseEntity<Response> deactivate(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/types-vehicules/{}/desactiver", uuid);
        TypeVehicule typeVehicule = typeVehiculeService.deactivate(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("typeVehicule", typeVehicule),
                        "Type de véhicule désactivé avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/types-vehicules/{uuid}/toggle-actif - Basculer
     */
    @PatchMapping("/{uuid}/toggle-actif")
    public ResponseEntity<Response> toggleActif(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/types-vehicules/{}/toggle-actif", uuid);
        TypeVehicule typeVehicule = typeVehiculeService.toggleActif(uuid);
        String message = Boolean.TRUE.equals(typeVehicule.getActif())
                ? "Type de véhicule activé avec succès"
                : "Type de véhicule désactivé avec succès";
        return ResponseEntity.ok(
                getResponse(request, Map.of("typeVehicule", typeVehicule), message, OK)
        );
    }

    /**
     * DELETE /billetterie/types-vehicules/{uuid} - Supprimer
     */
    @DeleteMapping("/{uuid}")
    public ResponseEntity<Response> delete(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request) {
        log.info("DELETE /billetterie/types-vehicules/{}", uuid);
        typeVehiculeService.delete(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of(), "Type de véhicule supprimé avec succès", OK)
        );
    }

    // ========== ENDPOINTS STATISTIQUES ==========

    /**
     * GET /billetterie/types-vehicules/stats - Statistiques
     */
    @GetMapping("/stats")
    public ResponseEntity<Response> getStats(HttpServletRequest request) {
        log.info("GET /billetterie/types-vehicules/stats");
        long total = typeVehiculeService.count();
        long actifs = typeVehiculeService.countActifs();
        return ResponseEntity.ok(
                getResponse(request, Map.of(
                        "total", total,
                        "actifs", actifs,
                        "inactifs", total - actifs
                ), "Statistiques récupérées avec succès", OK)
        );
    }
}