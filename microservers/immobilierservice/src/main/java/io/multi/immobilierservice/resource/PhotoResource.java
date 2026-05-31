package io.multi.immobilierservice.resource;

import io.multi.immobilierservice.domain.Photo;
import io.multi.immobilierservice.domain.Response;
import io.multi.immobilierservice.dto.UploadResult;
import io.multi.immobilierservice.repository.PhotoRepository;
import io.multi.immobilierservice.service.PhotoService;
import io.multi.immobilierservice.service.PhotoStorageService;
import io.multi.immobilierservice.utils.JwtUtils;
import io.multi.immobilierservice.utils.RequestUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;

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
@Slf4j
public class PhotoResource {

    private final PhotoService photoService;
    private final PhotoStorageService photoStorageService;
    private final PhotoRepository photoRepository;
    private final JwtUtils jwtUtils;

    /**
     * Reverse-proxy de la photo depuis MinIO. Public (anonyme + Google crawler).
     *
     * <p>Streaming chunk-by-chunk via {@link InputStreamResource} ; pas de
     * {@code readAllBytes()} en mémoire.
     *
     * <p>Si {@code thumb=true} mais que la photo n'a PAS de thumbnail
     * ({@code object_key_thumbnail = NULL}), on FALLBACK sur l'original pour
     * éviter une vignette cassée à l'affichage. Marketplace immo = photo
     * centrale, image lourde > image cassée. Cas théorique sur MinIO neuf
     * mais décision consciente.
     *
     * <p>ETag basé sur photo_uuid + suffixe "-thumb" pour différencier les 2
     * variantes — sinon un navigateur cacherait l'original et le servirait
     * sur 304 quand le client demande le thumbnail (même ETag).
     */
    @GetMapping("/{photoUuid}")
    public ResponseEntity<?> servePhoto(
            @PathVariable("photoUuid") String photoUuid,
            @RequestParam(value = "thumb", defaultValue = "false") boolean thumb,
            @RequestHeader(value = HttpHeaders.IF_NONE_MATCH, required = false) String ifNoneMatch
    ) {
        Optional<Photo> opt = photoRepository.findByUuid(photoUuid);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Photo p = opt.get();

        // Décide bucket + key. Fallback gracieux si thumb demandé mais absent.
        String bucket, key, contentType;
        boolean effectivelyThumb = thumb;
        if (thumb && p.getObjectKeyThumbnail() != null && !p.getObjectKeyThumbnail().isBlank()) {
            bucket = photoStorageService.getBucketThumbnails();
            key = p.getObjectKeyThumbnail();
            contentType = "image/jpeg";  // Thumbnailator force JPEG (cf. Phase 5)
        } else {
            if (thumb) {
                log.info("Fallback original sur photo {} sans thumbnail (object_key_thumbnail null)", photoUuid);
                effectivelyThumb = false;
            }
            bucket = photoStorageService.getBucketPhotos();
            key = p.getObjectKey();
            contentType = p.getTypeMime() != null ? p.getTypeMime() : "application/octet-stream";
        }

        // ETag basé sur uuid + variante. Cache cohérent même si la photo change
        // de couverture, ordre, etc. (l'image elle-même est immutable une fois uploadée).
        String etag = "\"" + photoUuid + (effectivelyThumb ? "-thumb" : "") + "\"";
        if (etag.equals(ifNoneMatch)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED)
                    .eTag(etag)
                    .cacheControl(CacheControl.maxAge(Duration.ofDays(1)).cachePublic())
                    .build();
        }

        try {
            ResponseInputStream<GetObjectResponse> s3stream =
                    photoStorageService.downloadStream(bucket, key);
            return ResponseEntity.ok()
                    .eTag(etag)
                    .cacheControl(CacheControl.maxAge(Duration.ofDays(1)).cachePublic())
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(new InputStreamResource(s3stream));
        } catch (NoSuchKeyException e) {
            log.warn("Photo BD présente mais ABSENTE de MinIO (orphelin) : photoUuid={} bucket={} key={}",
                    photoUuid, bucket, key);
            return ResponseEntity.notFound().build();
        }
    }

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
        // Streaming via fichier temp — pas de file.getBytes() (fix pre-prod).
        UploadResult result = photoStorageService.uploadPhoto(file);
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
