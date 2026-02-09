package io.multi.billetterieservice.domain;


import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_DEFAULT)
public class Depart {
    private Long departId;
    private String departUuid;
    private Long siteId;
    private String libelle;
    private String description;
    private Integer ordreAffichage;
    private Boolean actif;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Champs joints depuis Site
    private String siteUuid;
    private String siteNom;
    private String siteTypeSite;

    // Champs joints depuis Localisation (via Site)
    private String localisationUuid;
    private String adresseComplete;
    private Double latitude;
    private Double longitude;

    // Champs joints depuis la hiérarchie géographique
    private String quartierLibelle;
    private String communeLibelle;
    private String villeUuid;
    private String villeLibelle;
    private String regionLibelle;
}












