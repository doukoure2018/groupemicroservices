package io.multi.immobilierservice.resource;

import io.multi.immobilierservice.domain.Response;
import io.multi.immobilierservice.domain.Visite;
import io.multi.immobilierservice.dto.AnnulerVisiteRequest;
import io.multi.immobilierservice.dto.VisiteCreateRequest;
import io.multi.immobilierservice.service.VisiteService;
import io.multi.immobilierservice.utils.JwtUtils;
import io.multi.immobilierservice.utils.RequestUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/immo")
@RequiredArgsConstructor
public class VisiteResource {

    private final VisiteService visiteService;
    private final JwtUtils jwtUtils;

    /** Visiteur demande une visite sur un bien. */
    @PostMapping("/proprietes/{proprieteUuid}/visites")
    public ResponseEntity<Response> demander(@PathVariable String proprieteUuid,
                                              @Valid @RequestBody VisiteCreateRequest req,
                                              @AuthenticationPrincipal Jwt jwt,
                                              HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        Visite v = visiteService.demander(proprieteUuid, req, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                RequestUtils.getResponse(http, Map.of("visite", v),
                        "Demande de visite envoyée", HttpStatus.CREATED));
    }

    /** Côté visiteur : mes demandes. */
    @GetMapping("/visites/mes-demandes")
    public ResponseEntity<Response> mesDemandes(@RequestParam(defaultValue = "20") int limit,
                                                 @RequestParam(defaultValue = "0") int offset,
                                                 @AuthenticationPrincipal Jwt jwt,
                                                 HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        List<Visite> list = visiteService.findMesVisitesVisiteur(userId, limit, offset);
        long total = visiteService.countMesVisitesVisiteur(userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("visites", list, "total", total, "limit", limit, "offset", offset),
                "Mes demandes de visite", HttpStatus.OK));
    }

    /** Côté vendeur : visites planifiées sur mes annonces. */
    @GetMapping("/visites/sur-mes-annonces")
    public ResponseEntity<Response> surMesAnnonces(@RequestParam(defaultValue = "20") int limit,
                                                    @RequestParam(defaultValue = "0") int offset,
                                                    @AuthenticationPrincipal Jwt jwt,
                                                    HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        List<Visite> list = visiteService.findVisitesSurMesAnnonces(userId, limit, offset);
        long total = visiteService.countVisitesSurMesAnnonces(userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("visites", list, "total", total, "limit", limit, "offset", offset),
                "Visites sur mes annonces", HttpStatus.OK));
    }

    @PatchMapping("/visites/{visiteUuid}/confirmer")
    public ResponseEntity<Response> confirmer(@PathVariable String visiteUuid,
                                               @AuthenticationPrincipal Jwt jwt,
                                               HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        Visite v = visiteService.confirmer(visiteUuid, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("visite", v), "Visite confirmée", HttpStatus.OK));
    }

    @PatchMapping("/visites/{visiteUuid}/effectuer")
    public ResponseEntity<Response> effectuer(@PathVariable String visiteUuid,
                                               @RequestParam(required = false) String notesVendeur,
                                               @AuthenticationPrincipal Jwt jwt,
                                               HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        Visite v = visiteService.effectuer(visiteUuid, userId, notesVendeur);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("visite", v), "Visite marquée effectuée", HttpStatus.OK));
    }

    @PatchMapping("/visites/{visiteUuid}/annuler")
    public ResponseEntity<Response> annuler(@PathVariable String visiteUuid,
                                             @RequestBody(required = false) AnnulerVisiteRequest req,
                                             @AuthenticationPrincipal Jwt jwt,
                                             HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        String motif = (req != null) ? req.getMotifAnnulation() : null;
        Visite v = visiteService.annuler(visiteUuid, userId, motif);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("visite", v), "Visite annulée", HttpStatus.OK));
    }
}
