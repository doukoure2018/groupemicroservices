package io.multi.billetterieservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour la création et mise à jour d'un type de véhicule.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypeVehiculeRequest {

    @NotBlank(message = "Le libellé est obligatoire")
    @Size(max = 50, message = "Le libellé ne doit pas dépasser 50 caractères")
    private String libelle;

    private String description;

    @Min(value = 1, message = "La capacité minimale doit être au moins 1")
    private Integer capaciteMin;

    @Min(value = 1, message = "La capacité maximale doit être au moins 1")
    private Integer capaciteMax;

    private Boolean actif;
}