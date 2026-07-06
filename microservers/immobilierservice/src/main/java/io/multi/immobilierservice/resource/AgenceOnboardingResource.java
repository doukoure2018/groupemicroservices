package io.multi.immobilierservice.resource;

import io.multi.immobilierservice.domain.Agence;
import io.multi.immobilierservice.domain.Response;
import io.multi.immobilierservice.dto.OnboardingAgenceRequest;
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
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * Onboarding des agences immobilières (rôle ADMIN_IMMO) — cf. V31.
 * Parcours : inscription (type AGENCE) → complétion du profil ici →
 * soumission → examen par la conformité (SLA affiché : sous 24 h).
 */
@RestController
@RequestMapping("/immo/agences/onboarding")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ADMIN_IMMO','SUPER_ADMIN')")
public class AgenceOnboardingResource {

    private final AgenceService agenceService;
    private final JwtUtils jwtUtils;

    /** État de l'onboarding de l'utilisateur connecté (agence + statut, ou PROFIL_INCOMPLET si aucune). */
    @GetMapping("/me")
    public ResponseEntity<Response> me(@AuthenticationPrincipal Jwt jwt, HttpServletRequest httpRequest) {
        Long userId = jwtUtils.extractUserId(jwt);
        Map<String, Object> data = new HashMap<>();
        agenceService.findMonAgence(userId).ifPresentOrElse(
                agence -> {
                    data.put("agence", agence);
                    data.put("statut", agence.getStatutVerification());
                },
                () -> data.put("statut", "PROFIL_INCOMPLET"));
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest, data,
                "État de l'onboarding", HttpStatus.OK));
    }

    /** Crée ou complète le profil de l'agence (infos conformité). */
    @PutMapping
    public ResponseEntity<Response> save(@Valid @RequestBody OnboardingAgenceRequest request,
                                         @AuthenticationPrincipal Jwt jwt,
                                         HttpServletRequest httpRequest) {
        Long userId = jwtUtils.extractUserId(jwt);
        Agence agence = agenceService.saveOnboarding(request, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest, Map.of("agence", agence),
                "Profil agence enregistré", HttpStatus.OK));
    }

    /** Upload du document RCCM (PDF ou image, max 20 MB — stocké sur MinIO). */
    @PostMapping("/rccm")
    public ResponseEntity<Response> uploadRccm(@RequestParam("file") MultipartFile file,
                                               @AuthenticationPrincipal Jwt jwt,
                                               HttpServletRequest httpRequest) {
        Long userId = jwtUtils.extractUserId(jwt);
        Agence agence = agenceService.uploadRccm(file, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest, Map.of("agence", agence),
                "Document RCCM uploadé", HttpStatus.OK));
    }

    /** Soumet le dossier complet à la conformité → statut EN_VALIDATION. */
    @PostMapping("/soumettre")
    public ResponseEntity<Response> soumettre(@AuthenticationPrincipal Jwt jwt,
                                              HttpServletRequest httpRequest) {
        Long userId = jwtUtils.extractUserId(jwt);
        Agence agence = agenceService.soumettreConformite(userId);
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest, Map.of("agence", agence),
                "Dossier soumis — en cours de validation par la conformité (sous 24 h)", HttpStatus.OK));
    }
}
