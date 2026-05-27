package io.multi.immobilierservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class VerificationRequest {

    @NotBlank
    @Pattern(regexp = "VERIFIE|REJETE", message = "statut doit être VERIFIE ou REJETE")
    private String statut;

    private String notes;                  // motif de rejet ou commentaire admin
}
