package io.multi.immobilierservice.resource;

import io.multi.immobilierservice.domain.AgenceInvitation;
import io.multi.immobilierservice.domain.ProfilImmo;
import io.multi.immobilierservice.domain.Response;
import io.multi.immobilierservice.dto.RefuserInvitationRequest;
import io.multi.immobilierservice.service.AgenceInvitationService;
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
 * Endpoints liés aux invitations d'agent (acceptation/refus/listing).
 * L'émission d'une invitation se fait via {@link AgenceResource#ajouterAgent(...)}.
 */
@RestController
@RequestMapping("/immo/agences/invitations")
@RequiredArgsConstructor
public class AgenceInvitationResource {

    private final AgenceInvitationService invitationService;
    private final JwtUtils jwtUtils;

    @GetMapping("/mes-invitations")
    public ResponseEntity<Response> mesInvitations(@AuthenticationPrincipal Jwt jwt,
                                                   HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        List<AgenceInvitation> list = invitationService.mesInvitations(userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("invitations", list), "Mes invitations en attente", HttpStatus.OK));
    }

    @PostMapping("/{token}/accepter")
    public ResponseEntity<Response> accepter(@PathVariable String token,
                                             @AuthenticationPrincipal Jwt jwt,
                                             HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        ProfilImmo profil = invitationService.accepter(token, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                RequestUtils.getResponse(http, Map.of("profil", profil),
                        "Invitation acceptée — profil AGENT_AGENCE créé", HttpStatus.CREATED));
    }

    @PostMapping("/{token}/refuser")
    public ResponseEntity<Response> refuser(@PathVariable String token,
                                            @RequestBody(required = false) RefuserInvitationRequest request,
                                            @AuthenticationPrincipal Jwt jwt,
                                            HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        String motif = request != null ? request.getMotifRefus() : null;
        AgenceInvitation invitation = invitationService.refuser(token, userId, motif);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("invitation", invitation), "Invitation refusée", HttpStatus.OK));
    }

    @PostMapping("/{invitationUuid}/revoquer")
    public ResponseEntity<Response> revoquer(@PathVariable String invitationUuid,
                                             @AuthenticationPrincipal Jwt jwt,
                                             HttpServletRequest http) {
        Long requesterUserId = jwtUtils.extractUserId(jwt);
        AgenceInvitation invitation = invitationService.revoquer(invitationUuid, requesterUserId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("invitation", invitation), "Invitation révoquée", HttpStatus.OK));
    }
}
