package io.multi.billetterieservice.resource;

import io.multi.billetterieservice.domain.Response;
import io.multi.billetterieservice.dto.DeviceTokenRequest;
import io.multi.billetterieservice.service.DeviceTokenService;
import io.multi.billetterieservice.utils.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import static io.multi.billetterieservice.utils.RequestUtils.getResponse;
import static org.springframework.http.HttpStatus.OK;

@RestController
@RequestMapping("/billetterie/device-tokens")
@RequiredArgsConstructor
@Slf4j
public class DeviceTokenResource {

    private final DeviceTokenService deviceTokenService;
    private final JwtUtils jwtUtils;

    /** Enregistre le token FCM/APNs du device courant pour l'utilisateur connecté. */
    @PostMapping
    public ResponseEntity<Response> register(
            @Valid @RequestBody DeviceTokenRequest request,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest httpRequest) {
        Long userId = jwtUtils.extractUserId(jwt);
        deviceTokenService.register(userId, request.getToken(), request.getPlatform());
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of(),
                        "Token enregistré avec succès", OK)
        );
    }

    /** Désenregistre le token (logout sur ce device). */
    @DeleteMapping
    public ResponseEntity<Response> unregister(
            @RequestParam String token,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest httpRequest) {
        deviceTokenService.delete(token);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of(),
                        "Token supprimé", OK)
        );
    }
}
