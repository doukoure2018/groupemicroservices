package io.multi.immobilierservice.resource;

import io.multi.immobilierservice.domain.Response;
import io.multi.immobilierservice.service.ExpirationService;
import io.multi.immobilierservice.utils.RequestUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Endpoints admin pour piloter les jobs planifiés à la demande (testabilité
 * runtime). Sans ça, la seule façon de prouver que le job marche serait
 * d'attendre 02:00.
 */
@RestController
@RequestMapping("/immo/jobs")
@RequiredArgsConstructor
public class JobsResource {

    private final ExpirationService expirationService;

    /**
     * Déclenche immédiatement le job d'expiration. Réservé SUPER_ADMIN
     * (déclencher en prod sans réfléchir = retraits non désirés).
     */
    @PostMapping("/expiration/run-now")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<Response> runExpirationNow(HttpServletRequest http) {
        Map<String, Integer> stats = expirationService.executeJob();
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("stats", stats),
                "Job d'expiration exécuté",
                HttpStatus.OK));
    }
}
