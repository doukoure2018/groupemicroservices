package io.multi.immobilierservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AjouterAgentRequest {

    @NotNull
    private Long userId;                   // user à enregistrer comme agent de l'agence

    private String bio;
    private String telephoneContact;
}
