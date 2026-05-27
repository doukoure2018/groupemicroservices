package io.multi.immobilierservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Photo {

    private Long photoId;
    private String photoUuid;
    private Long proprieteId;
    private String url;
    private String urlThumbnail;
    private String objectKey;
    private String objectKeyThumbnail;
    private Integer ordreAffichage;
    private Boolean estCouverture;
    private Long tailleOctets;
    private String typeMime;
    private Integer largeur;
    private Integer hauteur;
    private OffsetDateTime createdAt;
}
