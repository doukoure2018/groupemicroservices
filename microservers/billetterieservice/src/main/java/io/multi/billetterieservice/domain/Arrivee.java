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
public class Arrivee {
    private Long arriveeId;
    private String arriveeUuid;
    private Long siteId;
    private Long departId;
    private String libelle;
    private String libelleDepart;
    private String description;
    private Integer ordreAffichage;
    private Boolean actif;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Champs joints depuis Site (arrivée)
    private String siteUuid;
    private String siteNom;
    private String siteTypeSite;

    // Champs joints depuis Localisation du Site d'arrivée
    private String localisationUuid;
    private String adresseComplete;
    private Double latitude;
    private Double longitude;

    // Hiérarchie du site d'arrivée
    private String quartierLibelle;
    private String communeLibelle;
    private String villeUuid;
    private String villeLibelle;
    private String regionLibelle;

    // Champs joints depuis Depart
    private String departUuid;
    private String departLibelle;

    // Champs joints depuis Site du départ
    private String departSiteUuid;
    private String departSiteNom;
    private String departVilleUuid;
    private String departVilleLibelle;
    private String departAdresseComplete;
    private Double departLatitude;
    private Double departLongitude;
}
