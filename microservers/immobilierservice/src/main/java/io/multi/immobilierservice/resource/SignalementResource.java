package io.multi.immobilierservice.resource;

import io.multi.immobilierservice.domain.Response;
import io.multi.immobilierservice.domain.Signalement;
import io.multi.immobilierservice.dto.SignalementCreateRequest;
import io.multi.immobilierservice.dto.TraiterSignalementRequest;
import io.multi.immobilierservice.service.SignalementService;
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

@RestController
@RequestMapping("/immo")
@RequiredArgsConstructor
public class SignalementResource {

    private final SignalementService signalementService;
    private final JwtUtils jwtUtils;

    /** Tout user authentifié peut signaler une annonce. */
    @PostMapping("/proprietes/{proprieteUuid}/signaler")
    public ResponseEntity<Response> signaler(@PathVariable String proprieteUuid,
                                              @Valid @RequestBody SignalementCreateRequest req,
                                              @AuthenticationPrincipal Jwt jwt,
                                              HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        Signalement s = signalementService.creer(proprieteUuid, req, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                RequestUtils.getResponse(http,
                        Map.of("signalement", s),
                        "Signalement enregistré, l'administration sera notifiée",
                        HttpStatus.CREATED));
    }

    /**
     * Admin uniquement. Statut par défaut : EN_ATTENTE.
     * Tri implicite SQL : propriétés avec le plus de signalements distincts en haut
     * (cf. SignalementQuery.FIND_FOR_ADMIN_BY_PROPRIETE).
     */
    @GetMapping("/signalements")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Response> findForAdmin(@RequestParam(defaultValue = "EN_ATTENTE") String statut,
                                                  @RequestParam(defaultValue = "20") int limit,
                                                  @RequestParam(defaultValue = "0") int offset,
                                                  HttpServletRequest http) {
        List<Signalement> list = signalementService.findForAdmin(statut, limit, offset);
        long total = signalementService.countForAdmin(statut);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("signalements", list, "total", total,
                       "statut", statut, "limit", limit, "offset", offset),
                "Liste des signalements", HttpStatus.OK));
    }

    @PatchMapping("/signalements/{signalementUuid}/traiter")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Response> traiter(@PathVariable String signalementUuid,
                                             @Valid @RequestBody TraiterSignalementRequest req,
                                             @AuthenticationPrincipal Jwt jwt,
                                             HttpServletRequest http) {
        Long adminUserId = jwtUtils.extractUserId(jwt);
        Signalement s = signalementService.traiter(signalementUuid,
                req.getAction(), req.getNotesAdmin(), adminUserId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("signalement", s),
                "Signalement traité : " + req.getAction(),
                HttpStatus.OK));
    }
}
