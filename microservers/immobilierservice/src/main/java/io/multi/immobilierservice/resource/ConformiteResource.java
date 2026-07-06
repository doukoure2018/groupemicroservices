package io.multi.immobilierservice.resource;

import io.multi.immobilierservice.domain.Agence;
import io.multi.immobilierservice.domain.Response;
import io.multi.immobilierservice.dto.RejeterRequest;
import io.multi.immobilierservice.service.AgenceService;
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
 * Backoffice conformité (rôle ADMIN_CONFORMITE) — validation des dossiers
 * d'agences immobilières soumis via l'onboarding (V31).
 * SLA affiché aux agences : décision sous 24 h (engagement, pas d'automatisme).
 */
@RestController
@RequestMapping("/immo/conformite")
@RequiredArgsConstructor
public class ConformiteResource {

    private final AgenceService agenceService;
    private final JwtUtils jwtUtils;

    /** File d'attente des dossiers EN_VALIDATION (plus anciens d'abord). */
    @GetMapping("/agences")
    @PreAuthorize("hasAnyAuthority('immo:conformite:read','ADMIN_CONFORMITE','SUPER_ADMIN')")
    public ResponseEntity<Response> enValidation(@RequestParam(defaultValue = "50") int limit,
                                                 @RequestParam(defaultValue = "0") int offset,
                                                 HttpServletRequest httpRequest) {
        List<Agence> agences = agenceService.listEnValidation(limit, offset);
        long total = agenceService.countEnValidation();
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest,
                Map.of("agences", agences, "total", total, "limit", limit, "offset", offset),
                "Dossiers agence en attente de validation", HttpStatus.OK));
    }

    /** Approbation → statut VERIFIE + email automatique à l'agence. */
    @PatchMapping("/agences/{agenceUuid}/approuver")
    @PreAuthorize("hasAnyAuthority('immo:conformite:update','ADMIN_CONFORMITE','SUPER_ADMIN')")
    public ResponseEntity<Response> approuver(@PathVariable String agenceUuid,
                                              @AuthenticationPrincipal Jwt jwt,
                                              HttpServletRequest httpRequest) {
        Long adminUserId = jwtUtils.extractUserId(jwt);
        Agence agence = agenceService.approuverConformite(agenceUuid, adminUserId);
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest, Map.of("agence", agence),
                "Agence approuvée — email de confirmation envoyé", HttpStatus.OK));
    }

    /** Rejet avec motif obligatoire → statut REJETE + email automatique à l'agence. */
    @PatchMapping("/agences/{agenceUuid}/rejeter")
    @PreAuthorize("hasAnyAuthority('immo:conformite:update','ADMIN_CONFORMITE','SUPER_ADMIN')")
    public ResponseEntity<Response> rejeter(@PathVariable String agenceUuid,
                                            @Valid @RequestBody RejeterRequest request,
                                            @AuthenticationPrincipal Jwt jwt,
                                            HttpServletRequest httpRequest) {
        Long adminUserId = jwtUtils.extractUserId(jwt);
        Agence agence = agenceService.rejeterConformite(agenceUuid, request.getMotif(), adminUserId);
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest, Map.of("agence", agence),
                "Agence rejetée — email envoyé avec le motif", HttpStatus.OK));
    }
}
