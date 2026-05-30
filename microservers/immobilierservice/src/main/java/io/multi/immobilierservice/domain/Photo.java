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

    /**
     * URL renvoyée aux clients : route RELATIVE vers le reverse-proxy gateway
     * (cf. PhotoResource#servePhoto, Phase 13b). Permet aux clients web/mobile
     * de préfixer avec leur propre apiBaseUrl (gateway public en prod, host
     * loopback en dev) au lieu d'hériter de l'URL MinIO {@code localhost:9100}
     * stockée historiquement en BD — qui n'est joignable que dans le réseau
     * Docker du backend.
     *
     * <p>Override le getter Lombok @Data. Le champ {@link #url} reste lu/écrit
     * par les row-mappers et les uploads (référence historique), mais n'est
     * plus exposé tel quel via JSON. Fallback sur le champ si {@code photoUuid}
     * est absent (ne devrait jamais arriver pour une photo persistée).
     */
    public String getUrl() {
        if (photoUuid == null || photoUuid.isBlank()) return url;
        return "/immo/photos/" + photoUuid;
    }

    /** Idem {@link #getUrl()}, variante thumbnail via query param. */
    public String getUrlThumbnail() {
        if (photoUuid == null || photoUuid.isBlank()) return urlThumbnail;
        return "/immo/photos/" + photoUuid + "?thumb=true";
    }
}
