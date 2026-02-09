package io.multi.billetterieservice.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO pour la création et mise à jour d'un mode de règlement.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModeReglementRequest {

    @NotBlank(message = "Le libellé est obligatoire")
    @Size(max = 50, message = "Le libellé ne doit pas dépasser 50 caractères")
    private String libelle;

    @NotBlank(message = "Le code est obligatoire")
    @Size(max = 20, message = "Le code ne doit pas dépasser 20 caractères")
    @Pattern(regexp = "^[A-Z_]+$", message = "Le code doit être en majuscules avec underscores uniquement")
    private String code;

    private String description;

    @Size(max = 255, message = "L'URL de l'icône ne doit pas dépasser 255 caractères")
    private String iconeUrl;

    @DecimalMin(value = "0.0", message = "Les frais en pourcentage doivent être positifs")
    @DecimalMax(value = "100.0", message = "Les frais en pourcentage ne peuvent pas dépasser 100%")
    private BigDecimal fraisPourcentage;

    @DecimalMin(value = "0.0", message = "Les frais fixes doivent être positifs")
    private BigDecimal fraisFixe;

    private Boolean actif;
}