package io.multi.billetterieservice.dto;


import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocalisationUpdateRequest {

    // Optionnel: permet de changer ou retirer le quartier
    private String quartierUuid;

    // Flag pour permettre de retirer le quartier (mettre à null)
    private Boolean removeQuartier;

    @NotBlank(message = "L'adresse complète est obligatoire")
    @Size(min = 5, max = 255, message = "L'adresse doit contenir entre 5 et 255 caractères")
    private String adresseComplete;

    @DecimalMin(value = "-90.0", message = "La latitude doit être comprise entre -90 et 90")
    @DecimalMax(value = "90.0", message = "La latitude doit être comprise entre -90 et 90")
    private BigDecimal latitude;

    @DecimalMin(value = "-180.0", message = "La longitude doit être comprise entre -180 et 180")
    @DecimalMax(value = "180.0", message = "La longitude doit être comprise entre -180 et 180")
    private BigDecimal longitude;

    @Size(max = 1000, message = "La description ne peut pas dépasser 1000 caractères")
    private String description;
}
