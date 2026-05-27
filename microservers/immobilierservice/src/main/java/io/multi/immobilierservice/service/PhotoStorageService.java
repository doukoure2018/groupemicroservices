package io.multi.immobilierservice.service;

import io.multi.immobilierservice.dto.UploadResult;

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
}
