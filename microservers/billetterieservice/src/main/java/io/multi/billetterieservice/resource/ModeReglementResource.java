package io.multi.billetterieservice.resource;

import io.multi.billetterieservice.domain.ModeReglement;
import io.multi.billetterieservice.domain.Response;
import io.multi.billetterieservice.dto.ModeReglementRequest;
import io.multi.billetterieservice.service.ModeReglementService;
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
 * Contrôleur REST pour la gestion des modes de règlement.
 * Base path: /billetterie/modes-reglement
 */
@RestController
@RequestMapping("/billetterie/modes-reglement")
@RequiredArgsConstructor
@Slf4j
public class ModeReglementResource {

    private final ModeReglementService modeReglementService;

    // ========== ENDPOINTS DE LECTURE ==========

    /**
     * GET /billetterie/modes-reglement - Liste tous les modes
     */
    @GetMapping
    public ResponseEntity<Response> getAll(HttpServletRequest request) {
        log.info("GET /billetterie/modes-reglement - Récupération de tous les modes");
        List<ModeReglement> modes = modeReglementService.getAll();
        return ResponseEntity.ok(
                getResponse(request, Map.of("modesReglement", modes, "total", modes.size()),
                        "Modes de règlement récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/modes-reglement/actifs - Liste modes actifs
     */
    @GetMapping("/actifs")
    public ResponseEntity<Response> getAllActifs(HttpServletRequest request) {
        log.info("GET /billetterie/modes-reglement/actifs - Récupération des modes actifs");
        List<ModeReglement> modes = modeReglementService.getAllActifs();
        return ResponseEntity.ok(
                getResponse(request, Map.of("modesReglement", modes, "total", modes.size()),
                        "Modes de règlement actifs récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/modes-reglement/{uuid} - Détail d'un mode
     */
    @GetMapping("/{uuid}")
    public ResponseEntity<Response> getByUuid(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/modes-reglement/{} - Récupération du mode", uuid);
        ModeReglement modeReglement = modeReglementService.getByUuid(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("modeReglement", modeReglement),
                        "Mode de règlement récupéré avec succès", OK)
        );
    }

    /**
     * GET /billetterie/modes-reglement/code/{code} - Par code
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<Response> getByCode(
            @PathVariable(name = "code") String code,
            HttpServletRequest request) {
        log.info("GET /billetterie/modes-reglement/code/{} - Récupération par code", code);
        ModeReglement modeReglement = modeReglementService.getByCode(code);
        return ResponseEntity.ok(
                getResponse(request, Map.of("modeReglement", modeReglement),
                        "Mode de règlement récupéré avec succès", OK)
        );
    }

    /**
     * GET /billetterie/modes-reglement/search?q=terme - Recherche
     */
    @GetMapping("/search")
    public ResponseEntity<Response> search(
            @RequestParam(name = "q") String searchTerm,
            HttpServletRequest request) {
        log.info("GET /billetterie/modes-reglement/search?q={} - Recherche", searchTerm);
        List<ModeReglement> modes = modeReglementService.search(searchTerm);
        return ResponseEntity.ok(
                getResponse(request, Map.of("modesReglement", modes, "total", modes.size()),
                        "Recherche effectuée avec succès", OK)
        );
    }

    /**
     * GET /billetterie/modes-reglement/sans-frais - Modes sans frais
     */
    @GetMapping("/sans-frais")
    public ResponseEntity<Response> getSansFrais(HttpServletRequest request) {
        log.info("GET /billetterie/modes-reglement/sans-frais");
        List<ModeReglement> modes = modeReglementService.getSansFrais();
        return ResponseEntity.ok(
                getResponse(request, Map.of("modesReglement", modes, "total", modes.size()),
                        "Modes de règlement sans frais récupérés avec succès", OK)
        );
    }

    /**
     * GET /billetterie/modes-reglement/{uuid}/calculer-frais?montant=X - Calculer frais
     */
    @GetMapping("/{uuid}/calculer-frais")
    public ResponseEntity<Response> calculerFrais(
            @PathVariable(name = "uuid") String uuid,
            @RequestParam(name = "montant") BigDecimal montant,
            HttpServletRequest request) {
        log.info("GET /billetterie/modes-reglement/{}/calculer-frais?montant={}", uuid, montant);
        BigDecimal frais = modeReglementService.calculerFrais(uuid, montant);
        BigDecimal total = montant.add(frais);
        return ResponseEntity.ok(
                getResponse(request, Map.of(
                        "montant", montant,
                        "frais", frais,
                        "total", total
                ), "Frais calculés avec succès", OK)
        );
    }

    // ========== ENDPOINTS D'ÉCRITURE ==========

    /**
     * POST /billetterie/modes-reglement - Créer un mode
     */
    @PostMapping
    public ResponseEntity<Response> create(
            @Valid @RequestBody ModeReglementRequest modeReglementRequest,
            HttpServletRequest request) {
        log.info("POST /billetterie/modes-reglement - Création: {}", modeReglementRequest.getCode());
        ModeReglement modeReglement = modeReglementService.create(modeReglementRequest);
        return ResponseEntity.status(CREATED).body(
                getResponse(request, Map.of("modeReglement", modeReglement),
                        "Mode de règlement créé avec succès", CREATED)
        );
    }

    /**
     * PUT /billetterie/modes-reglement/{uuid} - Mettre à jour
     */
    @PutMapping("/{uuid}")
    public ResponseEntity<Response> update(
            @PathVariable(name ="uuid") String uuid,
            @Valid @RequestBody ModeReglementRequest modeReglementRequest,
            HttpServletRequest request)
    {
        log.info("PUT /billetterie/modes-reglement/{} - Mise à jour", uuid);
        ModeReglement modeReglement = modeReglementService.update(uuid, modeReglementRequest);
        return ResponseEntity.ok(
                getResponse(request, Map.of("modeReglement", modeReglement),
                        "Mode de règlement mis à jour avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/modes-reglement/{uuid}/frais - Mettre à jour les frais
     */
    @PatchMapping("/{uuid}/frais")
    public ResponseEntity<Response> updateFrais(
            @PathVariable(name = "uuid") String uuid,
            @RequestParam(required = false,name = "fraisPourcentage") BigDecimal fraisPourcentage,
            @RequestParam(required = false,name = "fraisFixe") BigDecimal fraisFixe,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/modes-reglement/{}/frais - MAJ frais", uuid);
        ModeReglement modeReglement = modeReglementService.updateFrais(uuid, fraisPourcentage, fraisFixe);
        return ResponseEntity.ok(
                getResponse(request, Map.of("modeReglement", modeReglement),
                        "Frais mis à jour avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/modes-reglement/{uuid}/activer - Activer
     */
    @PatchMapping("/{uuid}/activer")
    public ResponseEntity<Response> activate(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request)
    {
        log.info("PATCH /billetterie/modes-reglement/{}/activer", uuid);
        ModeReglement modeReglement = modeReglementService.activate(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("modeReglement", modeReglement),
                        "Mode de règlement activé avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/modes-reglement/{uuid}/desactiver - Désactiver
     */
    @PatchMapping("/{uuid}/desactiver")
    public ResponseEntity<Response> deactivate(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/modes-reglement/{}/desactiver", uuid);
        ModeReglement modeReglement = modeReglementService.deactivate(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("modeReglement", modeReglement),
                        "Mode de règlement désactivé avec succès", OK)
        );
    }

    /**
     * PATCH /billetterie/modes-reglement/{uuid}/toggle-actif - Basculer
     */
    @PatchMapping("/{uuid}/toggle-actif")
    public ResponseEntity<Response> toggleActif(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request) {
        log.info("PATCH /billetterie/modes-reglement/{}/toggle-actif", uuid);
        ModeReglement modeReglement = modeReglementService.toggleActif(uuid);
        String message = Boolean.TRUE.equals(modeReglement.getActif())
                ? "Mode de règlement activé avec succès"
                : "Mode de règlement désactivé avec succès";
        return ResponseEntity.ok(
                getResponse(request, Map.of("modeReglement", modeReglement), message, OK)
        );
    }

    /**
     * DELETE /billetterie/modes-reglement/{uuid} - Supprimer
     */
    @DeleteMapping("/{uuid}")
    public ResponseEntity<Response> delete(
            @PathVariable(name = "uuid") String uuid,
            HttpServletRequest request) {
        log.info("DELETE /billetterie/modes-reglement/{}", uuid);
        modeReglementService.delete(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of(), "Mode de règlement supprimé avec succès", OK)
        );
    }

    // ========== ENDPOINTS STATISTIQUES ==========

    /**
     * GET /billetterie/modes-reglement/stats - Statistiques
     */
    @GetMapping("/stats")
    public ResponseEntity<Response> getStats(HttpServletRequest request) {
        log.info("GET /billetterie/modes-reglement/stats");
        long total = modeReglementService.count();
        long actifs = modeReglementService.countActifs();
        return ResponseEntity.ok(
                getResponse(request, Map.of(
                        "total", total,
                        "actifs", actifs,
                        "inactifs", total - actifs
                ), "Statistiques récupérées avec succès", OK)
        );
    }
}