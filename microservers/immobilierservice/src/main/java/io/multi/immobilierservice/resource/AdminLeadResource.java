package io.multi.immobilierservice.resource;

import io.multi.immobilierservice.domain.Contact;
import io.multi.immobilierservice.domain.Response;
import io.multi.immobilierservice.dto.LeadAdminView;
import io.multi.immobilierservice.dto.TraiterLeadRequest;
import io.multi.immobilierservice.service.ContactService;
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

/**
 * Back-office intermédiation (Phase 1) — gestion des leads.
 * Réservé aux comptes ADMIN_BACKOFFICE (et SUPER_ADMIN superviseur).
 * Visites = commit suivant (C3b-visites).
 */
@RestController
@RequestMapping("/immo/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ADMIN_BACKOFFICE','SUPER_ADMIN')")
public class AdminLeadResource {

    private final ContactService contactService;
    private final JwtUtils jwtUtils;

    /** Liste des leads contact (défaut : lead_statut=NOUVEAU), enrichis réf/titre propriété. */
    @GetMapping("/contacts")
    public ResponseEntity<Response> listContacts(@RequestParam(defaultValue = "NOUVEAU") String statut,
                                                 @RequestParam(defaultValue = "20") int limit,
                                                 @RequestParam(defaultValue = "0") int offset,
                                                 HttpServletRequest http) {
        List<LeadAdminView> list = contactService.findLeadsForAdmin(statut, limit, offset);
        long total = contactService.countLeadsForAdmin(statut);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("contacts", list, "total", total,
                        "statut", statut, "limit", limit, "offset", offset),
                "Liste des leads contact", HttpStatus.OK));
    }

    /** Marque un lead contact TRAITE|REJETE. Refus si déjà traité (pas de réécriture). */
    @PatchMapping("/contacts/{contactUuid}")
    public ResponseEntity<Response> traiterContact(@PathVariable String contactUuid,
                                                   @Valid @RequestBody TraiterLeadRequest req,
                                                   @AuthenticationPrincipal Jwt jwt,
                                                   HttpServletRequest http) {
        Long adminUserId = jwtUtils.extractUserId(jwt);
        Contact c = contactService.traiterLead(contactUuid, req.getAction(), req.getNoteAdmin(), adminUserId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("contact", c),
                "Lead contact traité : " + req.getAction(),
                HttpStatus.OK));
    }
}
