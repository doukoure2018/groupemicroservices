package io.multi.immobilierservice.resource;

import io.multi.immobilierservice.domain.Commodite;
import io.multi.immobilierservice.domain.Response;
import io.multi.immobilierservice.service.CommoditeService;
import io.multi.immobilierservice.utils.RequestUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/immo/commodites")
@RequiredArgsConstructor
public class CommoditeResource {

    private final CommoditeService commoditeService;

    @GetMapping
    public ResponseEntity<Response> findAll(HttpServletRequest http) {
        List<Commodite> commodites = commoditeService.findAll();
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("commodites", commodites), "Liste des commodités", HttpStatus.OK));
    }
}
