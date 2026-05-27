package io.multi.immobilierservice.resource;

import io.multi.immobilierservice.domain.Response;
import io.multi.immobilierservice.utils.RequestUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/immo")
public class HealthResource {

    @GetMapping("/health")
    public ResponseEntity<Response> health(HttpServletRequest request) {
        return ResponseEntity.ok(RequestUtils.getResponse(
                request,
                Map.of(
                        "service", "immobilierservice",
                        "port", 8098,
                        "status", "UP"
                ),
                "Immobilierservice is running",
                HttpStatus.OK
        ));
    }
}
