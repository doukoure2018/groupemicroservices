package io.multi.immobilierservice.resource;

import io.multi.immobilierservice.domain.Contact;
import io.multi.immobilierservice.domain.Response;
import io.multi.immobilierservice.dto.ContactCreateRequest;
import io.multi.immobilierservice.dto.ContactView;
import io.multi.immobilierservice.service.ContactService;
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

/**
 * Endpoints de contact entrant (Phase 10a).
 *
 * <p><b>Tous les endpoints requièrent un JWT</b>. Pas d'accès anonyme : sans cela,
 * la plateforme deviendrait une passerelle de spam pour bots. Voir
 * {@link ContactCreateRequest} pour la justification complète.
 */
@RestController
@RequestMapping("/immo")
@RequiredArgsConstructor
public class ContactResource {

    private final ContactService contactService;
    private final JwtUtils jwtUtils;

    /**
     * Crée une demande de contact sur une propriété. Les coordonnées du demandeur
     * (nom/téléphone/email) sont déduites du JWT via UserClient — non acceptées
     * dans le DTO pour éviter le spoofing.
     */
    @PostMapping("/proprietes/{proprieteUuid}/contact")
    public ResponseEntity<Response> creer(@PathVariable String proprieteUuid,
                                          @Valid @RequestBody ContactCreateRequest req,
                                          @AuthenticationPrincipal Jwt jwt,
                                          HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        Contact created = contactService.creer(proprieteUuid, req, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                RequestUtils.getResponse(http,
                        Map.of("contact", created),
                        "Demande de contact envoyée", HttpStatus.CREATED)
        );
    }

    /**
     * Contacts reçus par le vendeur connecté — chaque contact est enrichi avec
     * les infos LIVE du demandeur (re-fetch Feign) pour permettre un appel
     * direct avec ses coordonnées actuelles. Le snapshot reste en BD pour audit.
     */
    @GetMapping("/contacts/mes-contacts-recus")
    public ResponseEntity<Response> mesContactsRecus(@RequestParam(defaultValue = "20") int limit,
                                                      @RequestParam(defaultValue = "0") int offset,
                                                      @AuthenticationPrincipal Jwt jwt,
                                                      HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        List<ContactView> list = contactService.findMesContactsRecus(userId, limit, offset);
        long total = contactService.countMesContactsRecus(userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("contacts", list, "total", total, "limit", limit, "offset", offset),
                "Contacts reçus", HttpStatus.OK));
    }

    @GetMapping("/contacts/mes-contacts-envoyes")
    public ResponseEntity<Response> mesContactsEnvoyes(@RequestParam(defaultValue = "20") int limit,
                                                        @RequestParam(defaultValue = "0") int offset,
                                                        @AuthenticationPrincipal Jwt jwt,
                                                        HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        List<Contact> list = contactService.findMesContactsEnvoyes(userId, limit, offset);
        long total = contactService.countMesContactsEnvoyes(userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("contacts", list, "total", total, "limit", limit, "offset", offset),
                "Contacts envoyés", HttpStatus.OK));
    }

    @PatchMapping("/contacts/{contactUuid}/vu")
    public ResponseEntity<Response> marquerVu(@PathVariable String contactUuid,
                                              @AuthenticationPrincipal Jwt jwt,
                                              HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        Contact c = contactService.marquerVu(contactUuid, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("contact", c), "Marqué comme vu", HttpStatus.OK));
    }
}
