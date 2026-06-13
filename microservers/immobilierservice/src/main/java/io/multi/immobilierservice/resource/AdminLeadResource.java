package io.multi.immobilierservice.resource;

import io.multi.immobilierservice.domain.Contact;
import io.multi.immobilierservice.domain.Response;
import io.multi.immobilierservice.domain.Visite;
import io.multi.immobilierservice.dto.LeadAdminView;
import io.multi.immobilierservice.dto.LeadVisiteAdminView;
import io.multi.immobilierservice.dto.ProprietaireView;
import io.multi.immobilierservice.dto.TraiterLeadRequest;
import io.multi.immobilierservice.service.ContactService;
import io.multi.immobilierservice.service.VisiteService;
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
public class AdminLeadResource {

    private final ContactService contactService;
    private final VisiteService visiteService;
    private final JwtUtils jwtUtils;

    /** Liste des leads contact (défaut : lead_statut=NOUVEAU), enrichis réf/titre propriété. */
    @PreAuthorize("hasAnyAuthority('immo:lead:read','SUPER_ADMIN')")
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
    @PreAuthorize("hasAnyAuthority('immo:lead:update','SUPER_ADMIN')")
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

    /** Liste des leads visite (défaut : lead_statut=NOUVEAU), enrichis réf/titre propriété. */
    @PreAuthorize("hasAnyAuthority('immo:lead:read','SUPER_ADMIN')")
    @GetMapping("/visites")
    public ResponseEntity<Response> listVisites(@RequestParam(defaultValue = "NOUVEAU") String statut,
                                                @RequestParam(defaultValue = "20") int limit,
                                                @RequestParam(defaultValue = "0") int offset,
                                                HttpServletRequest http) {
        List<LeadVisiteAdminView> list = visiteService.findLeadsForAdmin(statut, limit, offset);
        long total = visiteService.countLeadsForAdmin(statut);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("visites", list, "total", total,
                        "statut", statut, "limit", limit, "offset", offset),
                "Liste des leads visite", HttpStatus.OK));
    }

    /** Marque un lead visite TRAITE|REJETE. Refus si déjà traité (pas de réécriture). */
    @PreAuthorize("hasAnyAuthority('immo:lead:update','SUPER_ADMIN')")
    @PatchMapping("/visites/{visiteUuid}")
    public ResponseEntity<Response> traiterVisite(@PathVariable String visiteUuid,
                                                  @Valid @RequestBody TraiterLeadRequest req,
                                                  @AuthenticationPrincipal Jwt jwt,
                                                  HttpServletRequest http) {
        Long adminUserId = jwtUtils.extractUserId(jwt);
        Visite v = visiteService.traiterLead(visiteUuid, req.getAction(), req.getNoteAdmin(), adminUserId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("visite", v),
                "Lead visite traité : " + req.getAction(),
                HttpStatus.OK));
    }

    /** Coordonnées du propriétaire d'une annonce (relais lead) — nom, email, tél, adresse. */
    @PreAuthorize("hasAnyAuthority('immo:lead:read','SUPER_ADMIN')")
    @GetMapping("/proprietes/{proprieteUuid}/proprietaire")
    public ResponseEntity<Response> getProprietaire(@PathVariable String proprieteUuid,
                                                    HttpServletRequest http) {
        ProprietaireView proprietaire = contactService.getProprietaireByPropriete(proprieteUuid);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("proprietaire", proprietaire),
                "Propriétaire de l'annonce",
                HttpStatus.OK));
    }
}
