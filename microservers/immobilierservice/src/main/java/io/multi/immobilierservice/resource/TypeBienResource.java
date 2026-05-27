package io.multi.immobilierservice.resource;

import io.multi.immobilierservice.domain.Response;
import io.multi.immobilierservice.domain.TypeBien;
import io.multi.immobilierservice.service.TypeBienService;
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
@RequestMapping("/immo/types-bien")
@RequiredArgsConstructor
public class TypeBienResource {

    private final TypeBienService typeBienService;

    @GetMapping
    public ResponseEntity<Response> findAll(HttpServletRequest http) {
        List<TypeBien> types = typeBienService.findAll();
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("types", types), "Liste des types de biens", HttpStatus.OK));
    }
}
