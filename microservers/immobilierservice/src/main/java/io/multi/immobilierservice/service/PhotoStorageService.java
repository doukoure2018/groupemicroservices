package io.multi.immobilierservice.service;

import io.multi.immobilierservice.dto.UploadResult;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

import java.io.IOException;

/**
 * Service de stockage des photos (et autres fichiers) sur MinIO via l'API S3.
 *
 * Upload : la photo originale est stockée dans `immo-photos`, une miniature
 * générée à la volée est stockée dans `immo-photos-thumbnails`.
 */
public interface PhotoStorageService {

    /**
     * Upload d'une photo + génération d'une miniature, streaming via fichier
     * temp disque (pas de byte[] en heap pour l'original).
     *
     * <p>Pre-prod hardening : éviter OOM sous trafic concurrent. Le fichier
     * passé via {@code MultipartFile.transferTo(tempFile)} est traité sur
     * disque pour validation+dimensions+upload S3+génération thumbnail. La
     * thumbnail (~33KB) reste en byte[] (acceptable, petit). Le tempFile est
     * supprimé en finally.
     *
     * @param file fichier multipart Spring (DOIT être une image — contentType
     *             contrôlé "image/...")
     * @return objet contenant URL publique, URL thumbnail, clés S3, dimensions
     * @throws IOException si transfert vers tempFile échoue (disque plein, etc.)
     */
    UploadResult uploadPhoto(org.springframework.web.multipart.MultipartFile file) throws IOException;

    /**
     * Upload d'un document arbitraire (PDF, image KYC) sans génération de thumbnail.
     */
    UploadResult uploadDocument(byte[] data, String originalFilename, String contentType, String bucket);

    /**
     * Suppression d'une photo et de sa miniature.
     */
    void deletePhoto(String objectKey, String objectKeyThumbnail);

    /**
     * Vérifie l'existence des buckets configurés et les crée au besoin (safety net si minio-init n'a pas tourné).
     */
    void ensureBucketsExist();

    /**
     * Streaming chunk-by-chunk depuis MinIO — JAMAIS readAllBytes().
     * Le caller fait passer le {@link ResponseInputStream} dans un
     * {@code InputStreamResource} retourné en HTTP : Spring pull les chunks
     * du stream S3 et push vers le ServletOutputStream, sans buffer complet.
     *
     * @return le stream (à fermer par le caller — typiquement Spring le fait
     *         après écriture du response body).
     * @throws software.amazon.awssdk.services.s3.model.NoSuchKeyException si la clé n'existe pas
     */
    ResponseInputStream<GetObjectResponse> downloadStream(String bucket, String key);

    /** Bucket S3 des photos originales. Utilisé par le serve photo endpoint. */
    String getBucketPhotos();

    /** Bucket S3 des thumbnails. Utilisé par le serve photo endpoint. */
    String getBucketThumbnails();
}
