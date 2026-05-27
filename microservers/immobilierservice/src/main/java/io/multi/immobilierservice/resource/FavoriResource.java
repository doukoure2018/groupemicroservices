package io.multi.immobilierservice.resource;

import io.multi.immobilierservice.domain.Propriete;
import io.multi.immobilierservice.domain.Response;
import io.multi.immobilierservice.service.FavoriService;
import io.multi.immobilierservice.utils.JwtUtils;
import io.multi.immobilierservice.utils.RequestUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Endpoints favoris (Phase 10a).
 *
 * <p>Tous les endpoints requièrent un JWT — {@code currentUserId} est extrait
 * du token, jamais d'un query param (anti-spoofing).
 *
 * <p>Note : pour vérifier si une propriété est en favoris dans une LISTE,
 * préférer {@code GET /immo/proprietes/recherche?...} qui inclut directement
 * {@code is_favorite} dans la réponse (anti N+1). L'endpoint
 * {@code GET /favoris/check} ici reste utile pour la page DÉTAIL d'une seule
 * propriété (1 appel ciblé).
 */
@RestController
@RequestMapping("/immo/favoris")
@RequiredArgsConstructor
public class FavoriResource {

    private final FavoriService favoriService;
    private final JwtUtils jwtUtils;

    @PostMapping("/{proprieteUuid}")
    public ResponseEntity<Response> ajouter(@PathVariable String proprieteUuid,
                                            @AuthenticationPrincipal Jwt jwt,
                                            HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        boolean created = favoriService.ajouter(proprieteUuid, userId);
        String msg = created ? "Ajouté aux favoris" : "Déjà dans vos favoris";
        return ResponseEntity.status(created ? HttpStatus.CREATED : HttpStatus.OK).body(
                RequestUtils.getResponse(http,
                        Map.of("ajouteCetteFois", created),
                        msg,
                        created ? HttpStatus.CREATED : HttpStatus.OK)
        );
    }

    @DeleteMapping("/{proprieteUuid}")
    public ResponseEntity<Response> retirer(@PathVariable String proprieteUuid,
                                            @AuthenticationPrincipal Jwt jwt,
                                            HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        boolean removed = favoriService.retirer(proprieteUuid, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("retire", removed),
                removed ? "Retiré des favoris" : "N'était pas dans vos favoris",
                HttpStatus.OK));
    }

    @GetMapping("/check")
    public ResponseEntity<Response> check(@RequestParam String proprieteUuid,
                                          @AuthenticationPrincipal Jwt jwt,
                                          HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        boolean is = favoriService.estFavori(proprieteUuid, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("isFavorite", is),
                "Statut favori récupéré", HttpStatus.OK));
    }

    @GetMapping("/mes-favoris")
    public ResponseEntity<Response> mesFavoris(@RequestParam(defaultValue = "20") int limit,
                                                @RequestParam(defaultValue = "0") int offset,
                                                @AuthenticationPrincipal Jwt jwt,
                                                HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        List<Propriete> list = favoriService.findMesFavoris(userId, limit, offset);
        long total = favoriService.countMesFavoris(userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("proprietes", list, "total", total, "limit", limit, "offset", offset),
                "Mes favoris", HttpStatus.OK));
    }
}
