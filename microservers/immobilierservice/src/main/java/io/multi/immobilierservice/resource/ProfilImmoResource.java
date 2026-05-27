package io.multi.immobilierservice.resource;

import io.multi.immobilierservice.domain.ProfilImmo;
import io.multi.immobilierservice.dto.ProfilImmoRequest;
import io.multi.immobilierservice.dto.VerificationRequest;
import io.multi.immobilierservice.domain.Response;
import io.multi.immobilierservice.utils.JwtUtils;
import io.multi.immobilierservice.utils.RequestUtils;
import io.multi.immobilierservice.service.ProfilImmoService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/immo/profils")
@RequiredArgsConstructor
public class ProfilImmoResource {

    private final ProfilImmoService profilImmoService;
    private final JwtUtils jwtUtils;

    @PostMapping
    public ResponseEntity<Response> create(@Valid @RequestBody ProfilImmoRequest request,
                                           @AuthenticationPrincipal Jwt jwt,
                                           HttpServletRequest httpRequest) {
        Long userId = jwtUtils.extractUserId(jwt);
        ProfilImmo created = profilImmoService.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                RequestUtils.getResponse(httpRequest, Map.of("profil", created),
                        "Profil immobilier créé", HttpStatus.CREATED)
        );
    }

    @GetMapping("/me")
    public ResponseEntity<Response> getMine(@AuthenticationPrincipal Jwt jwt,
                                            HttpServletRequest httpRequest) {
        Long userId = jwtUtils.extractUserId(jwt);
        ProfilImmo profil = profilImmoService.getByUserId(userId);
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest,
                Map.of("profil", profil), "Mon profil immobilier", HttpStatus.OK));
    }

    @GetMapping("/{profilUuid}")
    public ResponseEntity<Response> getByUuid(@PathVariable String profilUuid,
                                              HttpServletRequest httpRequest) {
        ProfilImmo profil = profilImmoService.getByUuid(profilUuid);
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest,
                Map.of("profil", profil), "Profil récupéré", HttpStatus.OK));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Response> getByUserId(@PathVariable Long userId,
                                                HttpServletRequest httpRequest) {
        ProfilImmo profil = profilImmoService.getByUserId(userId);
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest,
                Map.of("profil", profil), "Profil récupéré", HttpStatus.OK));
    }

    @PutMapping("/{profilUuid}")
    public ResponseEntity<Response> update(@PathVariable String profilUuid,
                                           @Valid @RequestBody ProfilImmoRequest request,
                                           @AuthenticationPrincipal Jwt jwt,
                                           HttpServletRequest httpRequest) {
        Long userId = jwtUtils.extractUserId(jwt);
        ProfilImmo updated = profilImmoService.update(profilUuid, request, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest,
                Map.of("profil", updated), "Profil mis à jour", HttpStatus.OK));
    }

    @PatchMapping("/{profilUuid}/verifier")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public ResponseEntity<Response> verifier(@PathVariable String profilUuid,
                                             @Valid @RequestBody VerificationRequest request,
                                             HttpServletRequest httpRequest) {
        ProfilImmo profil = profilImmoService.verifier(profilUuid, request.getStatut());
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest,
                Map.of("profil", profil), "Statut de vérification mis à jour", HttpStatus.OK));
    }

    @DeleteMapping("/{profilUuid}")
    public ResponseEntity<Response> delete(@PathVariable String profilUuid,
                                           @AuthenticationPrincipal Jwt jwt,
                                           HttpServletRequest httpRequest) {
        Long userId = jwtUtils.extractUserId(jwt);
        profilImmoService.softDelete(profilUuid, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(httpRequest,
                Map.of(), "Profil supprimé", HttpStatus.OK));
    }
}
