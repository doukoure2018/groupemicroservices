package io.multi.immobilierservice.resource;

import io.multi.immobilierservice.domain.Brouillon;
import io.multi.immobilierservice.domain.Propriete;
import io.multi.immobilierservice.domain.Response;
import io.multi.immobilierservice.dto.BrouillonSaveRequest;
import io.multi.immobilierservice.service.BrouillonService;
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
@RequestMapping("/immo/brouillons")
@RequiredArgsConstructor
public class BrouillonResource {

    private final BrouillonService brouillonService;
    private final JwtUtils jwtUtils;

    @PostMapping
    public ResponseEntity<Response> create(@Valid @RequestBody BrouillonSaveRequest req,
                                           @AuthenticationPrincipal Jwt jwt,
                                           HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        Brouillon created = brouillonService.create(req, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                RequestUtils.getResponse(http, Map.of("brouillon", created),
                        "Brouillon enregistré", HttpStatus.CREATED));
    }

    @PutMapping("/{brouillonUuid}")
    public ResponseEntity<Response> update(@PathVariable String brouillonUuid,
                                           @Valid @RequestBody BrouillonSaveRequest req,
                                           @AuthenticationPrincipal Jwt jwt,
                                           HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        Brouillon updated = brouillonService.update(brouillonUuid, req, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("brouillon", updated), "Brouillon mis à jour", HttpStatus.OK));
    }

    @GetMapping
    public ResponseEntity<Response> findMine(@AuthenticationPrincipal Jwt jwt,
                                             HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        List<Brouillon> mine = brouillonService.findMine(userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("brouillons", mine), "Mes brouillons", HttpStatus.OK));
    }

    @GetMapping("/{brouillonUuid}")
    public ResponseEntity<Response> getByUuid(@PathVariable String brouillonUuid,
                                              @AuthenticationPrincipal Jwt jwt,
                                              HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        Brouillon b = brouillonService.getByUuid(brouillonUuid, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("brouillon", b), "Brouillon récupéré", HttpStatus.OK));
    }

    @DeleteMapping("/{brouillonUuid}")
    public ResponseEntity<Response> delete(@PathVariable String brouillonUuid,
                                           @AuthenticationPrincipal Jwt jwt,
                                           HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        brouillonService.supprimer(brouillonUuid, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of(), "Brouillon supprimé", HttpStatus.OK));
    }

    /**
     * Convertit le brouillon en propriété (statut=BROUILLON).
     * Renvoie la propriété créée. Le frontend peut ensuite :
     * 1. uploader des photos via POST /immo/proprietes/{uuid}/photos
     * 2. publier via PATCH /immo/proprietes/{uuid}/publier
     */
    @PostMapping("/{brouillonUuid}/materialiser")
    public ResponseEntity<Response> materialiser(@PathVariable String brouillonUuid,
                                                  @AuthenticationPrincipal Jwt jwt,
                                                  HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        Propriete propriete = brouillonService.materialiser(brouillonUuid, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                RequestUtils.getResponse(http, Map.of("propriete", propriete),
                        "Propriété créée à partir du brouillon (statut=BROUILLON)",
                        HttpStatus.CREATED));
    }
}
