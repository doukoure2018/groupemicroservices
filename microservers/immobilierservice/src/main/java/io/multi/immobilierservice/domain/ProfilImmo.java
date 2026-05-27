package io.multi.immobilierservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfilImmo {

    private Long profilId;
    private String profilUuid;
    private Long userId;
    private String typeProfil;             // PROPRIETAIRE_SIMPLE | DEMARCHEUR | AGENT_AGENCE
    private Long agenceId;                 // requis si AGENT_AGENCE
    private String statutVerification;     // EN_ATTENTE | VERIFIE | REJETE
    private String documentsKycUrl;
    private String bio;
    private String telephoneContact;
    private BigDecimal noteMoyenne;
    private Integer nombreAvis;
    private Integer nombreProprietesActives;
    private Boolean actif;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
