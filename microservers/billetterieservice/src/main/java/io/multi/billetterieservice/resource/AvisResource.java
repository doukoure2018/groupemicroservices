package io.multi.billetterieservice.resource;

import io.multi.billetterieservice.domain.Response;
import io.multi.billetterieservice.dto.AvisRequest;
import io.multi.billetterieservice.utils.JwtUtils;
import io.multi.billetterieservice.service.AvisService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import static io.multi.billetterieservice.utils.RequestUtils.getResponse;
import static org.springframework.http.HttpStatus.CREATED;

@RestController
@RequestMapping("/billetterie/avis")
@RequiredArgsConstructor
@Slf4j
public class AvisResource {

    private final AvisService avisService;
    private final JwtUtils jwtUtils;

    @PostMapping
    public ResponseEntity<Response> createAvis(
            @Valid @RequestBody AvisRequest request,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest httpRequest) {
        Long userId = jwtUtils.extractUserId(jwt);
        log.info("POST /billetterie/avis - userId: {}, commandeUuid: {}", userId, request.getCommandeUuid());
        avisService.createAvis(request, userId);
        return ResponseEntity.status(CREATED).body(
                getResponse(httpRequest, Map.of(),
                        "Avis créé avec succès", CREATED)
        );
    }
}
