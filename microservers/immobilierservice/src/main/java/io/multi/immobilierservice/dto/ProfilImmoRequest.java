package io.multi.immobilierservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProfilImmoRequest {

    @NotBlank
    @Pattern(regexp = "PROPRIETAIRE_SIMPLE|DEMARCHEUR|AGENT_AGENCE",
            message = "typeProfil doit être PROPRIETAIRE_SIMPLE, DEMARCHEUR ou AGENT_AGENCE")
    private String typeProfil;

    private String agenceUuid;             // requis si AGENT_AGENCE

    @Size(max = 500)
    private String documentsKycUrl;        // URL externe pour l'instant (MinIO en Phase 5)

    @Size(max = 2000)
    private String bio;

    @Size(max = 20)
    private String telephoneContact;
}
