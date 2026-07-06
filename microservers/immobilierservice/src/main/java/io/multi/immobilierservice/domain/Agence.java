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
    private String statutVerification;     // PROFIL_INCOMPLET | EN_ATTENTE | EN_VALIDATION | VERIFIE | REJETE (V31)
    private String documentsKycUrl;
    private LocalDate dateCreationAgence;
    private Boolean actif;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Onboarding conformité (V31)
    private String adresse;
    private Long communeId;
    private Long regionId;
    private String telephoneWhatsapp;
    private String motifRejet;
    private OffsetDateTime dateSoumissionConformite;
}
