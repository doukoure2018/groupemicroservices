package io.multi.billetterieservice.resource;

import io.multi.billetterieservice.domain.Offre;
import io.multi.billetterieservice.domain.Response;
import io.multi.billetterieservice.domain.SiegesOffre;
import io.multi.billetterieservice.service.OffreService;
import io.multi.billetterieservice.service.sieges.SiegesService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

import static io.multi.billetterieservice.utils.RequestUtils.getResponse;
import static org.springframework.http.HttpStatus.OK;

/** Le plan d'une offre et ses sièges pris : public, comme la fiche du voyage. */
@RestController
@RequiredArgsConstructor
public class SiegeResource {

    private final OffreService offreService;
    private final SiegesService siegesService;

    @GetMapping("/billetterie/offres/{uuid}/sieges")
    public ResponseEntity<Response> sieges(@PathVariable String uuid, HttpServletRequest request) {
        Offre offre = offreService.getByUuid(uuid);
        SiegesOffre sieges = siegesService.siegesOffre(offre);
        return ResponseEntity.ok(getResponse(request, Map.of("sieges", sieges), "Plan de sièges récupéré", OK));
    }
}
