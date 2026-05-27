package io.multi.immobilierservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Agence {

    private Long agenceId;
    private String agenceUuid;
    private String nom;
    private String raisonSociale;
    private String numeroRegistre;
    private String logoUrl;
    private String telephone;
    private String email;
    private Long localisationId;
    private String description;
    private String siteWeb;
    private String reseauxSociauxJson;     // JSONB stocké en String
    private Long proprietaireUserId;
    private String statutVerification;     // EN_ATTENTE | VERIFIE | REJETE
    private String documentsKycUrl;
    private LocalDate dateCreationAgence;
    private Boolean actif;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
