package io.multi.billetterieservice.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO pour la création et la mise à jour d'un trajet.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrajetRequest {

    @NotBlank(message = "L'UUID du point de départ est obligatoire")
    private String departUuid;

    @NotBlank(message = "L'UUID du point d'arrivée est obligatoire")
    private String arriveeUuid;

    @Size(max = 150, message = "Le libellé du trajet ne doit pas dépasser 150 caractères")
    private String libelleTrajet;

    @DecimalMin(value = "0.0", message = "La distance doit être positive")
    private BigDecimal distanceKm;

    @NotNull(message = "La durée estimée est obligatoire")
    @Min(value = 1, message = "La durée doit être d'au moins 1 minute")
    private Integer dureeEstimeeMinutes;

    @NotNull(message = "Le montant de base est obligatoire")
    @DecimalMin(value = "0.0", inclusive = false, message = "Le montant de base doit être positif")
    private BigDecimal montantBase;

    @DecimalMin(value = "0.0", message = "Le montant bagages doit être positif ou nul")
    private BigDecimal montantBagages;

    @Size(max = 3, message = "Le code devise ne doit pas dépasser 3 caractères")
    private String devise;

    private String description;

    private String instructions;

    private Boolean actif;
}