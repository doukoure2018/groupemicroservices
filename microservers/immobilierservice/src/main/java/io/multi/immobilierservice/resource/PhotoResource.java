package io.multi.immobilierservice.resource;

import io.multi.immobilierservice.domain.Photo;
import io.multi.immobilierservice.domain.Response;
import io.multi.immobilierservice.dto.UploadResult;
import io.multi.immobilierservice.service.PhotoService;
import io.multi.immobilierservice.service.PhotoStorageService;
import io.multi.immobilierservice.utils.JwtUtils;
import io.multi.immobilierservice.utils.RequestUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Endpoints transverses aux photos :
 *  - opérations directes sur une photo (par photoUuid)
 *  - endpoints de test pour valider MinIO
 *
 * L'upload lié à une propriété se fait sur /immo/proprietes/{uuid}/photos
 * (cf. {@link ProprieteResource}).
 */
@RestController
@RequestMapping("/immo/photos")
@RequiredArgsConstructor
public class PhotoResource {

    private final PhotoService photoService;
    private final PhotoStorageService photoStorageService;
    private final JwtUtils jwtUtils;

    @PatchMapping("/{photoUuid}/couverture")
    public ResponseEntity<Response> definirCouverture(@PathVariable String photoUuid,
                                                       @AuthenticationPrincipal Jwt jwt,
                                                       HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        Photo photo = photoService.definirCouverture(photoUuid, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of("photo", photo), "Photo définie comme couverture", HttpStatus.OK));
    }

    @DeleteMapping("/{photoUuid}")
    public ResponseEntity<Response> supprimer(@PathVariable String photoUuid,
                                              @AuthenticationPrincipal Jwt jwt,
                                              HttpServletRequest http) {
        Long userId = jwtUtils.extractUserId(jwt);
        photoService.supprimer(photoUuid, userId);
        return ResponseEntity.ok(RequestUtils.getResponse(http,
                Map.of(), "Photo supprimée", HttpStatus.OK));
    }

    // ---- endpoints test MinIO (debug uniquement) ----

    @PostMapping(value = "/test-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Response> testUpload(@RequestParam("file") MultipartFile file,
                                               HttpServletRequest request) throws IOException {
        UploadResult result = photoStorageService.uploadPhoto(
                file.getBytes(), file.getOriginalFilename(), file.getContentType());
        return ResponseEntity.ok(RequestUtils.getResponse(request,
                Map.of("upload", result), "Photo uploadée", HttpStatus.OK));
    }

    @DeleteMapping("/test-delete")
    public ResponseEntity<Response> testDelete(@RequestParam("key") String objectKey,
                                               @RequestParam(value = "thumbKey", required = false) String thumbKey,
                                               HttpServletRequest request) {
        photoStorageService.deletePhoto(objectKey, thumbKey);
        return ResponseEntity.ok(RequestUtils.getResponse(request,
                Map.of(), "Photo supprimée", HttpStatus.OK));
    }
}
