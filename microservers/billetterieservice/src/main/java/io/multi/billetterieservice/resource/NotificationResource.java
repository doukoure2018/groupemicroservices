package io.multi.billetterieservice.resource;

import io.multi.billetterieservice.domain.InAppNotification;
import io.multi.billetterieservice.domain.PreferencesNotification;
import io.multi.billetterieservice.domain.Response;
import io.multi.billetterieservice.utils.JwtUtils;
import io.multi.billetterieservice.service.InAppNotificationService;
import io.multi.billetterieservice.service.PreferencesNotificationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import static io.multi.billetterieservice.utils.RequestUtils.getResponse;
import static org.springframework.http.HttpStatus.OK;

@RestController
@RequestMapping("/billetterie/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationResource {

    private final InAppNotificationService notificationService;
    private final PreferencesNotificationService preferencesService;
    private final JwtUtils jwtUtils;

    /**
     * GET /billetterie/notifications/preferences — ce que le voyageur accepte
     * de recevoir en notification poussée. Sans ligne enregistrée, tout est activé.
     */
    @GetMapping("/preferences")
    public ResponseEntity<Response> getPreferences(@AuthenticationPrincipal Jwt jwt, HttpServletRequest request) {
        PreferencesNotification preferences = preferencesService.lire(jwtUtils.extractUserId(jwt));
        return ResponseEntity.ok(getResponse(request, Map.of("preferences", preferences),
                "Préférences récupérées", OK));
    }

    @PutMapping("/preferences")
    public ResponseEntity<Response> majPreferences(@RequestBody PreferencesNotification preferences,
                                                   @AuthenticationPrincipal Jwt jwt,
                                                   HttpServletRequest request) {
        PreferencesNotification enregistrees = preferencesService.enregistrer(jwtUtils.extractUserId(jwt), preferences);
        return ResponseEntity.ok(getResponse(request, Map.of("preferences", enregistrees),
                "Préférences enregistrées", OK));
    }

    @GetMapping
    public ResponseEntity<Response> getNotifications(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest request) {
        Long userId = jwtUtils.extractUserId(jwt);
        List<InAppNotification> notifications = notificationService.getByUserId(userId, page, size);
        return ResponseEntity.ok(
                getResponse(request, Map.of("notifications", notifications),
                        "Notifications récupérées avec succès", OK)
        );
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Response> getUnreadCount(
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {
        Long userId = jwtUtils.extractUserId(jwt);
        Long count = notificationService.countUnread(userId);
        return ResponseEntity.ok(
                getResponse(request, Map.of("unreadCount", count),
                        "Compteur récupéré", OK)
        );
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Response> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {
        Long userId = jwtUtils.extractUserId(jwt);
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(
                getResponse(request, Map.of(),
                        "Notification marquée comme lue", OK)
        );
    }

    @PutMapping("/read-all")
    public ResponseEntity<Response> markAllAsRead(
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {
        Long userId = jwtUtils.extractUserId(jwt);
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(
                getResponse(request, Map.of(),
                        "Toutes les notifications marquées comme lues", OK)
        );
    }
}
