package io.multi.immobilierservice.service.impl;

import io.multi.immobilierservice.dto.UploadResult;
import io.multi.immobilierservice.exception.ApiException;
import io.multi.immobilierservice.service.PhotoStorageService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PhotoStorageServiceImpl implements PhotoStorageService {

    private static final long MAX_SIZE_OCTETS = 10L * 1024 * 1024; // 10 MB
    private static final DateTimeFormatter DATE_PREFIX = DateTimeFormatter.ofPattern("yyyy/MM/dd");

    private final S3Client s3Client;

    @Value("${minio.bucket-photos}")
    private String bucketPhotos;

    @Value("${minio.bucket-thumbnails}")
    private String bucketThumbnails;

    @Value("${minio.thumbnail.width:400}")
    private int thumbWidth;

    @Value("${minio.thumbnail.height:300}")
    private int thumbHeight;

    @Value("${minio.thumbnail.quality:0.85}")
    private double thumbQuality;

    @Value("${minio.public-base-url}")
    private String publicBaseUrl;

    @PostConstruct
    public void init() {
        try {
            ensureBucketsExist();
        } catch (Exception e) {
            log.warn("Impossible de vérifier les buckets MinIO au démarrage : {}", e.getMessage());
        }
    }

    @Override
    public UploadResult uploadPhoto(MultipartFile file) throws IOException {
        // Pre-prod hardening : streaming via fichier temp disque au lieu de
        // charger byte[] en heap. Évite OOM sous trafic concurrent (5 uploads
        // 10MB = 50MB heap au lieu de 0 avec cette approche). Le tempFile est
        // supprimé en finally — best-effort, l'OS nettoie /tmp si besoin.
        final String contentType = file.getContentType();
        final String originalFilename = file.getOriginalFilename();
        final long size = file.getSize();

        validateSize(size, contentType);

        File tempFile = Files.createTempFile("immo-photo-", ".tmp").toFile();
        try {
            file.transferTo(tempFile);

            String extension = extractExtension(originalFilename, contentType);
            String objectKey = generateKey(extension);
            String objectKeyThumb = generateKey("jpg"); // thumbnails toujours en JPEG

            // 1. Lire les dimensions de l'original (depuis le tempFile, pas heap)
            Integer largeur = null, hauteur = null;
            try {
                BufferedImage original = ImageIO.read(tempFile);
                if (original != null) {
                    largeur = original.getWidth();
                    hauteur = original.getHeight();
                }
            } catch (IOException e) {
                log.warn("Lecture dimensions image échouée : {}", e.getMessage());
            }

            // 2. Upload original (streaming via tempFile)
            putObjectFromFile(bucketPhotos, objectKey, contentType, tempFile);

            // 3. Générer + uploader thumbnail (thumb reste petit ~33KB, byte[] OK)
            byte[] thumbData = generateThumbnailFromFile(tempFile);
            putObject(bucketThumbnails, objectKeyThumb, "image/jpeg", thumbData);

            log.info("Photo uploadée (streaming) : key={} ({} octets), thumb={} ({} octets)",
                    objectKey, size, objectKeyThumb, thumbData.length);

            return UploadResult.builder()
                    .url(buildPublicUrl(bucketPhotos, objectKey))
                    .urlThumbnail(buildPublicUrl(bucketThumbnails, objectKeyThumb))
                    .objectKey(objectKey)
                    .objectKeyThumbnail(objectKeyThumb)
                    .sizeOctets(size)
                    .contentType(contentType)
                    .largeur(largeur)
                    .hauteur(hauteur)
                    .build();
        } finally {
            if (!tempFile.delete()) {
                log.debug("tempFile {} non supprimé (OS s'en chargera)", tempFile);
            }
        }
    }

    @Override
    public UploadResult uploadDocument(byte[] data, String originalFilename, String contentType, String bucket) {
        if (data == null || data.length == 0) {
            throw new ApiException("Fichier vide");
        }
        if (data.length > 20L * 1024 * 1024) {
            throw new ApiException("Document trop volumineux (max 20 MB)");
        }
        String extension = extractExtension(originalFilename, contentType);
        String objectKey = generateKey(extension);
        String targetBucket = (bucket != null && !bucket.isBlank()) ? bucket : bucketPhotos;

        putObject(targetBucket, objectKey, contentType, data);
        log.info("Document uploadé : bucket={} key={} ({} octets)", targetBucket, objectKey, data.length);

        return UploadResult.builder()
                .url(buildPublicUrl(targetBucket, objectKey))
                .objectKey(objectKey)
                .sizeOctets((long) data.length)
                .contentType(contentType)
                .build();
    }

    @Override
    public void deletePhoto(String objectKey, String objectKeyThumbnail) {
        if (objectKey != null && !objectKey.isBlank()) {
            deleteObjectSafe(bucketPhotos, objectKey);
        }
        if (objectKeyThumbnail != null && !objectKeyThumbnail.isBlank()) {
            deleteObjectSafe(bucketThumbnails, objectKeyThumbnail);
        }
    }

    @Override
    public ResponseInputStream<GetObjectResponse> downloadStream(String bucket, String key) {
        return s3Client.getObject(GetObjectRequest.builder()
                .bucket(bucket).key(key).build());
    }

    @Override public String getBucketPhotos() { return bucketPhotos; }

    @Override public String getBucketThumbnails() { return bucketThumbnails; }

    @Override
    public void ensureBucketsExist() {
        for (String bucket : List.of(bucketPhotos, bucketThumbnails)) {
            try {
                s3Client.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
                log.debug("Bucket {} existe", bucket);
            } catch (NoSuchBucketException e) {
                log.info("Création bucket {}", bucket);
                s3Client.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
            } catch (S3Exception e) {
                // HeadBucket retourne parfois 403 si le bucket existe sans droits ListBuckets
                // → on considère qu'il existe et on continue
                if (e.statusCode() != 403 && e.statusCode() != 404) {
                    log.warn("Vérification bucket {} échouée (code={}): {}", bucket, e.statusCode(), e.getMessage());
                }
            }
        }
    }

    // ---- private helpers ----

    private void validateImage(byte[] data, String contentType) {
        if (data == null || data.length == 0) {
            throw new ApiException("Fichier vide");
        }
        if (data.length > MAX_SIZE_OCTETS) {
            throw new ApiException("Image trop volumineuse (max " + (MAX_SIZE_OCTETS / 1024 / 1024) + " MB)");
        }
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ApiException("Type non supporté : " + contentType + " (attendu image/*)");
        }
    }

    /**
     * Validation pré-transfert (pas besoin de charger les bytes pour vérifier
     * size+contentType). Utilisée par le path streaming MultipartFile.
     */
    private void validateSize(long size, String contentType) {
        if (size <= 0) {
            throw new ApiException("Fichier vide");
        }
        if (size > MAX_SIZE_OCTETS) {
            throw new ApiException("Image trop volumineuse (max " + (MAX_SIZE_OCTETS / 1024 / 1024) + " MB)");
        }
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ApiException("Type non supporté : " + contentType + " (attendu image/*)");
        }
    }

    private byte[] generateThumbnail(byte[] data) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Thumbnails.of(new ByteArrayInputStream(data))
                    .size(thumbWidth, thumbHeight)
                    .outputQuality(thumbQuality)
                    .outputFormat("jpg")
                    .toOutputStream(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new ApiException("Erreur génération thumbnail : " + e.getMessage());
        }
    }

    /**
     * Génération thumbnail depuis fichier disque (path streaming). Le thumb
     * reste petit (~33KB JPEG), retour en byte[] acceptable mémoire.
     */
    private byte[] generateThumbnailFromFile(File source) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Thumbnails.of(source)
                    .size(thumbWidth, thumbHeight)
                    .outputQuality(thumbQuality)
                    .outputFormat("jpg")
                    .toOutputStream(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new ApiException("Erreur génération thumbnail : " + e.getMessage());
        }
    }

    private void putObject(String bucket, String key, String contentType, byte[] data) {
        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(contentType)
                        .contentLength((long) data.length)
                        .build(),
                RequestBody.fromBytes(data)
        );
    }

    /**
     * Upload S3 streaming depuis un fichier disque — pas de chargement en heap
     * de l'original. Utilisé par {@link #uploadPhoto(MultipartFile)} pour
     * éviter OOM sous trafic concurrent.
     */
    private void putObjectFromFile(String bucket, String key, String contentType, File source) {
        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(contentType)
                        .contentLength(source.length())
                        .build(),
                RequestBody.fromFile(source)
        );
    }

    private void deleteObjectSafe(String bucket, String key) {
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
            log.debug("Objet supprimé : bucket={} key={}", bucket, key);
        } catch (S3Exception e) {
            log.warn("Suppression objet {}/{} échouée : {}", bucket, key, e.getMessage());
        }
    }

    private String extractExtension(String filename, String contentType) {
        if (filename != null && filename.contains(".")) {
            String ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
            if (ext.matches("[a-z0-9]{1,5}")) return ext;
        }
        if (contentType != null) {
            return switch (contentType) {
                case "image/jpeg", "image/jpg" -> "jpg";
                case "image/png" -> "png";
                case "image/webp" -> "webp";
                case "image/gif" -> "gif";
                case "application/pdf" -> "pdf";
                default -> "bin";
            };
        }
        return "bin";
    }

    private String generateKey(String extension) {
        String datePrefix = LocalDate.now().format(DATE_PREFIX);
        return datePrefix + "/" + UUID.randomUUID() + "." + extension;
    }

    private String buildPublicUrl(String bucket, String key) {
        String base = publicBaseUrl.endsWith("/") ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1) : publicBaseUrl;
        return base + "/" + bucket + "/" + key;
    }
}
