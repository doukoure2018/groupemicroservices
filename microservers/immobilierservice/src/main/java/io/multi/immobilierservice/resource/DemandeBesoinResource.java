package io.multi.immobilierservice.resource;

import io.multi.immobilierservice.domain.DemandeBesoin;
import io.multi.immobilierservice.domain.Response;
import io.multi.immobilierservice.dto.DemandeCreateRequest;
import io.multi.immobilierservice.service.DemandeBesoinService;
import io.multi.immobilierservice.utils.JwtUtils;
import io.multi.immobilierservice.utils.RequestUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Déclarations de besoin des clients (V32) — créées depuis l'app mobile,
 * diffusées par email aux agences vérifiées de la zone et consultables
 * dans le backoffice des agences (« Demandes clients »).
 */
@RestController
@RequestMapping("/immo/demandes")
@RequiredArgsConstructor
public class DemandeBesoinResource {

    private final DemandeBesoinService demandeService;
    private final JwtUtils jwtUtils;

    /** Déclaration d'un besoin par un client connecté (mobile). */
    @PostMapping
    public ResponseEntity<Response> create(@Valid @RequestBody DemandeCreateRequest request,
                                           @AuthenticationPrincipal Jwt jwt,
                                           HttpServletRequest httpRequest) {
        Long userId = jwtUtils.extractUserId(jwt);
        DemandeBesoin demande = demandeService.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                RequestUtils.getResponse(httpRequest, Map.of("demande", demande),
                        "Votre besoin a été transmis aux agences de la zone", HttpStatus.CREATED));
    }

    /** Demandes du client connecté. */
    @GetMapping("/mes-demandes")
    public ResponseEntity<Response> mesDemandes(@AuthenticationPrincipal Jwt jwt,
                                                HttpServletRequest httpRequest) {
        Long userId = jwtUtils.extractUserId(jwt);
        List<DemandeBesoin> demandes = demandeService.mesDemandes(userId);
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest,
                Map.of("demandes", demandes, "total", demandes.size()),
                "Vos demandes", HttpStatus.OK));
    }

    /** Annulation par le client. */
    @PatchMapping("/{demandeUuid}/annuler")
    public ResponseEntity<Response> annuler(@PathVariable String demandeUuid,
                                            @AuthenticationPrincipal Jwt jwt,
                                            HttpServletRequest httpRequest) {
        Long userId = jwtUtils.extractUserId(jwt);
        DemandeBesoin demande = demandeService.annuler(demandeUuid, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest, Map.of("demande", demande),
                "Demande annulée", HttpStatus.OK));
    }

    /**
     * Demandes clients pour l'agence de l'utilisateur connecté (VERIFIEE).
     * scope=ZONE (défaut : commune/région de l'agence) ou TOUTES.
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN_IMMO','immo:demande:read','SUPER_ADMIN')")
    public ResponseEntity<Response> pourMonAgence(@RequestParam(defaultValue = "ZONE") String scope,
                                                  @RequestParam(defaultValue = "50") int limit,
                                                  @RequestParam(defaultValue = "0") int offset,
                                                  @AuthenticationPrincipal Jwt jwt,
                                                  HttpServletRequest httpRequest) {
        Long userId = jwtUtils.extractUserId(jwt);
        Map<String, Object> data = demandeService.pourMonAgence(userId, scope, limit, offset);
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest, data,
                "Demandes clients", HttpStatus.OK));
    }
}
