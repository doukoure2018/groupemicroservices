package io.multi.billetterieservice.resource;

import io.multi.billetterieservice.domain.Commande;
import io.multi.billetterieservice.domain.Response;
import io.multi.billetterieservice.dto.CommandeRequest;
import io.multi.billetterieservice.service.CommandeService;
import io.multi.billetterieservice.utils.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import static io.multi.billetterieservice.utils.RequestUtils.getResponse;
import static org.springframework.http.HttpStatus.*;

@RestController
@RequestMapping("/billetterie/commandes")
@RequiredArgsConstructor
@Slf4j
public class CommandeResource {

    private final CommandeService commandeService;
    private final JwtUtils jwtUtils;

    /**
     * POST /billetterie/commandes - Créer une commande avec billets et paiement
     */
    @PostMapping
    public ResponseEntity<Response> creerCommande(
            @Valid @RequestBody CommandeRequest commandeRequest,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {
        Long userId = jwtUtils.extractUserId(jwt);
        log.info("POST /billetterie/commandes - userId: {}, offre: {}", userId, commandeRequest.getOffreUuid());
        Commande commande = commandeService.creerCommande(commandeRequest, userId);
        return ResponseEntity.status(CREATED).body(
                getResponse(request, Map.of("commande", commande),
                        "Commande créée avec succès", CREATED)
        );
    }

    /**
     * GET /billetterie/commandes/mes-commandes - Liste des commandes de l'utilisateur connecté
     */
    @GetMapping("/mes-commandes")
    public ResponseEntity<Response> getMesCommandes(
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {
        Long userId = jwtUtils.extractUserId(jwt);
        log.info("GET /billetterie/commandes/mes-commandes - userId: {}", userId);
        List<Commande> commandes = commandeService.getCommandesByUserId(userId);
        return ResponseEntity.ok(
                getResponse(request, Map.of("commandes", commandes),
                        "Commandes récupérées avec succès", OK)
        );
    }

    /**
     * PUT /billetterie/commandes/{uuid}/annuler - Annuler une commande
     */
    @PutMapping("/{uuid}/annuler")
    public ResponseEntity<Response> annulerCommande(
            @PathVariable String uuid,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {
        Long userId = jwtUtils.extractUserId(jwt);
        log.info("PUT /billetterie/commandes/{}/annuler - userId: {}", uuid, userId);
        Commande commande = commandeService.annulerCommande(uuid, userId);
        return ResponseEntity.ok(
                getResponse(request, Map.of("commande", commande),
                        "Commande annulée avec succès", OK)
        );
    }

    /**
     * GET /billetterie/commandes/{uuid} - Détail d'une commande
     */
    @GetMapping("/{uuid}")
    public ResponseEntity<Response> getByUuid(
            @PathVariable String uuid,
            HttpServletRequest request) {
        log.info("GET /billetterie/commandes/{}", uuid);
        Commande commande = commandeService.getByUuid(uuid);
        return ResponseEntity.ok(
                getResponse(request, Map.of("commande", commande),
                        "Commande récupérée avec succès", OK)
        );
    }
}
