package io.multi.immobilierservice.resource;

import io.multi.immobilierservice.domain.PreferencesNotification;
import io.multi.immobilierservice.domain.Response;
import io.multi.immobilierservice.dto.PreferencesNotificationUpdateRequest;
import io.multi.immobilierservice.service.PreferencesNotificationService;
import io.multi.immobilierservice.utils.JwtUtils;
import io.multi.immobilierservice.utils.RequestUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Self-service uniquement : un user gère SES préférences.
 * Pas d'endpoint admin (un admin debug en lisant la table SQL en attendant).
 */
@RestController
@RequestMapping("/immo/preferences")
@RequiredArgsConstructor
public class PreferencesNotificationResource {

    private final PreferencesNotificationService preferencesService;
    private final JwtUtils jwtUtils;

    @GetMapping
    public ResponseEntity<Response> get(@AuthenticationPrincipal Jwt jwt,
                                         HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        PreferencesNotification prefs = preferencesService.getOrDefaults(userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("preferences", prefs),
                "Préférences notification",
                HttpStatus.OK));
    }

    @PatchMapping
    public ResponseEntity<Response> update(@RequestBody PreferencesNotificationUpdateRequest req,
                                            @AuthenticationPrincipal Jwt jwt,
                                            HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        PreferencesNotification updated = preferencesService.update(userId, req);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("preferences", updated),
                "Préférences mises à jour",
                HttpStatus.OK));
    }
}
