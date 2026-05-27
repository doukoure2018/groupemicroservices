package io.multi.immobilierservice.resource;

import io.multi.immobilierservice.domain.Agence;
import io.multi.immobilierservice.domain.ProfilImmo;
import io.multi.immobilierservice.domain.Response;
import io.multi.immobilierservice.dto.AgenceRequest;
import io.multi.immobilierservice.dto.AjouterAgentRequest;
import io.multi.immobilierservice.dto.VerificationRequest;
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

@RestController
@RequestMapping("/immo/agences")
@RequiredArgsConstructor
public class AgenceResource {

    private final AgenceService agenceService;
    private final JwtUtils jwtUtils;

    @PostMapping
    public ResponseEntity<Response> create(@Valid @RequestBody AgenceRequest request,
                                           @AuthenticationPrincipal Jwt jwt,
                                           HttpServletRequest httpRequest) {
        Long userId = jwtUtils.extractUserId(jwt);
        Agence created = agenceService.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                RequestUtils.getResponse(httpRequest, Map.of("agence", created),
                        "Agence créée", HttpStatus.CREATED)
        );
    }

    @GetMapping
    public ResponseEntity<Response> findAll(@RequestParam(defaultValue = "20") int limit,
                                            @RequestParam(defaultValue = "0") int offset,
                                            HttpServletRequest httpRequest) {
        List<Agence> agences = agenceService.findAll(limit, offset);
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest,
                Map.of("agences", agences, "limit", limit, "offset", offset),
                "Liste des agences", HttpStatus.OK));
    }

    @GetMapping("/mes-agences")
    public ResponseEntity<Response> findMine(@AuthenticationPrincipal Jwt jwt,
                                             HttpServletRequest httpRequest) {
        Long userId = jwtUtils.extractUserId(jwt);
        List<Agence> agences = agenceService.findMine(userId);
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest,
                Map.of("agences", agences), "Mes agences", HttpStatus.OK));
    }

    @GetMapping("/{agenceUuid}")
    public ResponseEntity<Response> getByUuid(@PathVariable String agenceUuid,
                                              HttpServletRequest httpRequest) {
        Agence agence = agenceService.getByUuid(agenceUuid);
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest,
                Map.of("agence", agence), "Agence récupérée", HttpStatus.OK));
    }

    @PutMapping("/{agenceUuid}")
    public ResponseEntity<Response> update(@PathVariable String agenceUuid,
                                           @Valid @RequestBody AgenceRequest request,
                                           @AuthenticationPrincipal Jwt jwt,
                                           HttpServletRequest httpRequest) {
        Long userId = jwtUtils.extractUserId(jwt);
        Agence updated = agenceService.update(agenceUuid, request, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest,
                Map.of("agence", updated), "Agence mise à jour", HttpStatus.OK));
    }

    @PatchMapping("/{agenceUuid}/verifier")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public ResponseEntity<Response> verifier(@PathVariable String agenceUuid,
                                             @Valid @RequestBody VerificationRequest request,
                                             HttpServletRequest httpRequest) {
        Agence agence = agenceService.verifier(agenceUuid, request.getStatut());
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest,
                Map.of("agence", agence), "Statut de vérification mis à jour", HttpStatus.OK));
    }

    @DeleteMapping("/{agenceUuid}")
    public ResponseEntity<Response> delete(@PathVariable String agenceUuid,
                                           @AuthenticationPrincipal Jwt jwt,
                                           HttpServletRequest httpRequest) {
        Long userId = jwtUtils.extractUserId(jwt);
        agenceService.softDelete(agenceUuid, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest,
                Map.of(), "Agence supprimée", HttpStatus.OK));
    }

    // ---- Agents d'agence ----

    @GetMapping("/{agenceUuid}/agents")
    public ResponseEntity<Response> listAgents(@PathVariable String agenceUuid,
                                               HttpServletRequest httpRequest) {
        List<ProfilImmo> agents = agenceService.listerAgents(agenceUuid);
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest,
                Map.of("agents", agents), "Agents de l'agence", HttpStatus.OK));
    }

    @PostMapping("/{agenceUuid}/agents")
    public ResponseEntity<Response> ajouterAgent(@PathVariable String agenceUuid,
                                                 @Valid @RequestBody AjouterAgentRequest request,
                                                 @AuthenticationPrincipal Jwt jwt,
                                                 HttpServletRequest httpRequest) {
        Long requesterUserId = jwtUtils.extractUserId(jwt);
        ProfilImmo profil = agenceService.ajouterAgent(agenceUuid, request, requesterUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                RequestUtils.getResponse(httpRequest, Map.of("profil", profil),
                        "Agent ajouté à l'agence", HttpStatus.CREATED)
        );
    }

    @DeleteMapping("/{agenceUuid}/agents/{userIdAgent}")
    public ResponseEntity<Response> retirerAgent(@PathVariable String agenceUuid,
                                                 @PathVariable Long userIdAgent,
                                                 @AuthenticationPrincipal Jwt jwt,
                                                 HttpServletRequest httpRequest) {
        Long requesterUserId = jwtUtils.extractUserId(jwt);
        agenceService.retirerAgent(agenceUuid, userIdAgent, requesterUserId);
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest,
                Map.of(), "Agent retiré", HttpStatus.OK));
    }
}
