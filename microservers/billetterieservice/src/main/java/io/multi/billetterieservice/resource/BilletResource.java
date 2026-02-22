package io.multi.billetterieservice.resource;

import io.multi.billetterieservice.domain.Billet;
import io.multi.billetterieservice.domain.Response;
import io.multi.billetterieservice.utils.JwtUtils;
import io.multi.billetterieservice.service.BilletService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import static io.multi.billetterieservice.utils.RequestUtils.getResponse;
import static org.springframework.http.HttpStatus.OK;

@RestController
@RequestMapping("/billetterie/billets")
@RequiredArgsConstructor
@Slf4j
public class BilletResource {

    private final BilletService billetService;
    private final JwtUtils jwtUtils;

    @PostMapping("/validate")
    public ResponseEntity<Response> validateBillet(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest httpRequest) {
        Long userId = jwtUtils.extractUserId(jwt);
        String codeBillet = request.get("codeBillet");
        log.info("POST /billetterie/billets/validate - codeBillet: {}, userId: {}", codeBillet, userId);
        Billet billet = billetService.validateBillet(codeBillet, userId);
        return ResponseEntity.ok(
                getResponse(httpRequest, Map.of("billet", billet),
                        "Billet validé avec succès", OK)
        );
    }
}
