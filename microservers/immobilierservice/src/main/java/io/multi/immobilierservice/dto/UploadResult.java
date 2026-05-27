package io.multi.immobilierservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Résultat de l'upload d'une photo vers MinIO.
 * Contient les URLs publiques (originale + thumbnail) et les clés d'objet
 * (utilisées pour la suppression).
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UploadResult {

    private String url;                  // URL publique de la photo originale
    private String urlThumbnail;         // URL publique de la miniature
    private String objectKey;            // clé S3 (pour suppression)
    private String objectKeyThumbnail;
    private Long sizeOctets;
    private String contentType;
    private Integer largeur;             // dimensions de l'image originale
    private Integer hauteur;
}
