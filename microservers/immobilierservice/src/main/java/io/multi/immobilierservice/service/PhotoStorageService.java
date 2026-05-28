package io.multi.immobilierservice.service;

import io.multi.immobilierservice.dto.UploadResult;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

/**
 * Service de stockage des photos (et autres fichiers) sur MinIO via l'API S3.
 *
 * Upload : la photo originale est stockée dans `immo-photos`, une miniature
 * générée à la volée est stockée dans `immo-photos-thumbnails`.
 */
public interface PhotoStorageService {

    /**
     * Upload d'une photo + génération d'une miniature.
     *
     * @param data            contenu binaire du fichier
     * @param originalFilename nom original (utilisé pour l'extension)
     * @param contentType     ex. "image/jpeg" — doit commencer par "image/"
     * @return objet contenant URL publique, URL thumbnail, clés S3, dimensions
     */
    UploadResult uploadPhoto(byte[] data, String originalFilename, String contentType);

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
