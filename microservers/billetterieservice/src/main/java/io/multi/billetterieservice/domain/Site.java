package io.multi.billetterieservice.domain;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalTime;
import java.time.OffsetDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_DEFAULT)
public class Site {
    private Long siteId;
    private String siteUuid;
    private Long localisationId;
    private String nom;
    private String description;
    private String typeSite;
    private Integer capaciteVehicules;
    private String telephone;
    private String email;
    private LocalTime horaireOuverture;
    private LocalTime horaireFermeture;
    private String imageUrl;
    private Boolean actif;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Champs joints depuis Localisation
    private String localisationUuid;
    private String adresseComplete;
    private Double latitude;
    private Double longitude;

    // Champs joints depuis la hiérarchie géographique
    private String quartierUuid;
    private String quartierLibelle;
    private String communeUuid;
    private String communeLibelle;
    private String villeUuid;
    private String villeLibelle;
    private String regionUuid;
    private String regionLibelle;
}