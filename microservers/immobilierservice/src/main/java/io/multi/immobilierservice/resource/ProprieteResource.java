package io.multi.immobilierservice.resource;

import io.multi.immobilierservice.domain.Photo;
import io.multi.immobilierservice.domain.Propriete;
import io.multi.immobilierservice.domain.Response;
import io.multi.immobilierservice.dto.OrdrePhotoRequest;
import io.multi.immobilierservice.dto.ProprieteCreateRequest;
import io.multi.immobilierservice.dto.ProprieteSearchCriteria;
import io.multi.immobilierservice.dto.ProprieteUpdateRequest;
import io.multi.immobilierservice.dto.RejeterRequest;
import io.multi.immobilierservice.dto.SearchResult;
import io.multi.immobilierservice.service.PhotoService;
import io.multi.immobilierservice.service.ProprieteService;
import io.multi.immobilierservice.service.RechercheService;
import io.multi.immobilierservice.utils.JwtUtils;
import io.multi.immobilierservice.utils.RequestUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/immo/proprietes")
@RequiredArgsConstructor
public class ProprieteResource {

    private final ProprieteService proprieteService;
    private final PhotoService photoService;
    private final RechercheService rechercheService;
    private final JwtUtils jwtUtils;

    // ---- RECHERCHE (Phase 8) — endpoint public ----

    @GetMapping("/recherche")
    public ResponseEntity<Response> rechercher(
            @RequestParam(required = false) String typeAnnonce,
            @RequestParam(required = false) String dureeLocation,
            @RequestParam(required = false) List<String> typeBienCodes,
            @RequestParam(required = false) String villeUuid,
            @RequestParam(required = false) String communeUuid,
            @RequestParam(required = false) String quartierUuid,
            @RequestParam(required = false) BigDecimal prixMin,
            @RequestParam(required = false) BigDecimal prixMax,
            @RequestParam(required = false) String devise,
            @RequestParam(required = false) Integer chambresMin,
            @RequestParam(required = false) BigDecimal surfaceMin,
            @RequestParam(required = false) List<String> commoditesCodes,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double rayonKm,
            @RequestParam(required = false) String trier,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset,
            HttpServletRequest http) {

        ProprieteSearchCriteria criteria = new ProprieteSearchCriteria();
        criteria.setTypeAnnonce(typeAnnonce);
        criteria.setDureeLocation(dureeLocation);
        criteria.setTypeBienCodes(typeBienCodes);
        criteria.setVilleUuid(villeUuid);
        criteria.setCommuneUuid(communeUuid);
        criteria.setQuartierUuid(quartierUuid);
        criteria.setPrixMin(prixMin);
        criteria.setPrixMax(prixMax);
        criteria.setDevise(devise);
        criteria.setChambresMin(chambresMin);
        criteria.setSurfaceMin(surfaceMin);
        criteria.setCommoditesCodes(commoditesCodes);
        criteria.setQ(q);
        criteria.setLat(lat);
        criteria.setLng(lng);
        criteria.setRayonKm(rayonKm);
        criteria.setTrier(trier);
        criteria.setLimit(limit);
        criteria.setOffset(offset);

        SearchResult result = rechercheService.rechercher(criteria);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of(
                        "proprietes", result.getProprietes(),
                        "total", result.getTotal(),
                        "limit", result.getLimit(),
                        "offset", result.getOffset(),
                        "tri", result.getTri()
                ),
                "Résultats de recherche", HttpStatus.OK));
    }

    // ---- CRUD ----

    @PostMapping
    public ResponseEntity<Response> create(@Valid @RequestBody ProprieteCreateRequest req,
                                           @AuthenticationPrincipal Jwt jwt,
                                           HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        Propriete created = proprieteService.create(req, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                RequestUtils.getResponse(http, Map.of("propriete", created),
                        "Propriété créée", HttpStatus.CREATED));
    }

    @GetMapping("/{proprieteUuid}")
    public ResponseEntity<Response> getByUuid(@PathVariable String proprieteUuid,
                                              HttpServletRequest http) {
        Propriete p = proprieteService.getByUuid(proprieteUuid, true);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("propriete", p), "Propriété récupérée", HttpStatus.OK));
    }

    @GetMapping("/mes-proprietes")
    public ResponseEntity<Response> findMine(@RequestParam(defaultValue = "20") int limit,
                                             @RequestParam(defaultValue = "0") int offset,
                                             @AuthenticationPrincipal Jwt jwt,
                                             HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        List<Propriete> list = proprieteService.findMine(userId, limit, offset);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("proprietes", list, "limit", limit, "offset", offset),
                "Mes propriétés", HttpStatus.OK));
    }

    @PutMapping("/{proprieteUuid}")
    public ResponseEntity<Response> update(@PathVariable String proprieteUuid,
                                           @Valid @RequestBody ProprieteUpdateRequest req,
                                           @AuthenticationPrincipal Jwt jwt,
                                           HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        Propriete updated = proprieteService.update(proprieteUuid, req, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("propriete", updated), "Propriété mise à jour", HttpStatus.OK));
    }

    @DeleteMapping("/{proprieteUuid}")
    public ResponseEntity<Response> delete(@PathVariable String proprieteUuid,
                                           @AuthenticationPrincipal Jwt jwt,
                                           HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        proprieteService.supprimer(proprieteUuid, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of(), "Propriété retirée", HttpStatus.OK));
    }

    // ---- Transitions de statut ----

    @PatchMapping("/{proprieteUuid}/publier")
    public ResponseEntity<Response> publier(@PathVariable String proprieteUuid,
                                            @AuthenticationPrincipal Jwt jwt,
                                            HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        Propriete p = proprieteService.publier(proprieteUuid, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("propriete", p), "Propriété publiée", HttpStatus.OK));
    }

    @PatchMapping("/{proprieteUuid}/retirer")
    public ResponseEntity<Response> retirer(@PathVariable String proprieteUuid,
                                            @AuthenticationPrincipal Jwt jwt,
                                            HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        Propriete p = proprieteService.retirer(proprieteUuid, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("propriete", p), "Propriété retirée", HttpStatus.OK));
    }

    // ---- Renouvellement (Phase 9b) ----

    @PostMapping("/{proprieteUuid}/renouveler")
    public ResponseEntity<Response> renouveler(@PathVariable String proprieteUuid,
                                               @AuthenticationPrincipal Jwt jwt,
                                               HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        Propriete p = proprieteService.renouveler(proprieteUuid, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("propriete", p), "Annonce renouvelée", HttpStatus.OK));
    }

    // ---- Modération admin (Phase 9a) ----

    @PatchMapping("/{proprieteUuid}/valider")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Response> valider(@PathVariable String proprieteUuid,
                                            HttpServletRequest http) {
        Propriete p = proprieteService.valider(proprieteUuid);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("propriete", p), "Annonce validée et publiée", HttpStatus.OK));
    }

    @PatchMapping("/{proprieteUuid}/rejeter")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Response> rejeter(@PathVariable String proprieteUuid,
                                            @Valid @RequestBody RejeterRequest req,
                                            HttpServletRequest http) {
        Propriete p = proprieteService.rejeter(proprieteUuid, req.getMotif());
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("propriete", p), "Annonce rejetée", HttpStatus.OK));
    }

    @PatchMapping("/{proprieteUuid}/marquer-vendu")
    public ResponseEntity<Response> marquerVendu(@PathVariable String proprieteUuid,
                                                 @AuthenticationPrincipal Jwt jwt,
                                                 HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        Propriete p = proprieteService.marquerVendu(proprieteUuid, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("propriete", p), "Propriété marquée vendue", HttpStatus.OK));
    }

    @PatchMapping("/{proprieteUuid}/marquer-loue")
    public ResponseEntity<Response> marquerLoue(@PathVariable String proprieteUuid,
                                                @AuthenticationPrincipal Jwt jwt,
                                                HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        Propriete p = proprieteService.marquerLoue(proprieteUuid, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("propriete", p), "Propriété marquée louée", HttpStatus.OK));
    }

    // ---- Photos liées à la propriété ----

    @PostMapping(value = "/{proprieteUuid}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Response> uploadPhoto(@PathVariable String proprieteUuid,
                                                @RequestParam("file") MultipartFile file,
                                                @AuthenticationPrincipal Jwt jwt,
                                                HttpServletRequest http) throws IOException {
        Long userId = jwtUtils.extractUserId(jwt);
        Photo photo = photoService.uploadPhotoPropriete(
                proprieteUuid, file.getBytes(), file.getOriginalFilename(),
                file.getContentType(), userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                RequestUtils.getResponse(http, Map.of("photo", photo),
                        "Photo ajoutée", HttpStatus.CREATED));
    }

    @GetMapping("/{proprieteUuid}/photos")
    public ResponseEntity<Response> listPhotos(@PathVariable String proprieteUuid,
                                               HttpServletRequest http) {
        List<Photo> photos = photoService.findByPropriete(proprieteUuid);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("photos", photos), "Photos de la propriété", HttpStatus.OK));
    }

    @PatchMapping("/{proprieteUuid}/photos/ordre")
    public ResponseEntity<Response> reordonnerPhotos(@PathVariable String proprieteUuid,
                                                     @Valid @RequestBody OrdrePhotoRequest req,
                                                     @AuthenticationPrincipal Jwt jwt,
                                                     HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        photoService.reordonner(proprieteUuid, req.getPhotoUuidsEnOrdre(), userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of(), "Ordre des photos mis à jour", HttpStatus.OK));
    }
}
