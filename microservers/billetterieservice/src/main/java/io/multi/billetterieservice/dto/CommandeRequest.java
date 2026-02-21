package io.multi.billetterieservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommandeRequest {

    @NotBlank(message = "L'offre est obligatoire")
    private String offreUuid;

    @NotEmpty(message = "Au moins un passager est requis")
    @Valid
    private List<PassagerDto> passagers;

    @NotBlank(message = "Le mode de règlement est obligatoire")
    private String modeReglementCode;

    @NotNull(message = "Le montant total est obligatoire")
    private BigDecimal montantTotal;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PassagerDto {
        @NotBlank(message = "Le nom du passager est obligatoire")
        private String nom;

        @NotBlank(message = "Le prénom du passager est obligatoire")
        private String prenom;

        @NotBlank(message = "Le téléphone du passager est obligatoire")
        private String telephone;

        private String pieceIdentite;
    }
}
