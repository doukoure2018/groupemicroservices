package io.multi.billetterieservice.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO pour la création et mise à jour d'une offre de transport.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OffreRequest {

    @NotBlank(message = "Le trajet est obligatoire")
    private String trajetUuid;

    @NotBlank(message = "Le véhicule est obligatoire")
    private String vehiculeUuid;

    @NotNull(message = "La date de départ est obligatoire")
    @FutureOrPresent(message = "La date de départ doit être aujourd'hui ou dans le futur")
    private LocalDate dateDepart;

    @NotNull(message = "L'heure de départ est obligatoire")
    private LocalTime heureDepart;

    private LocalTime heureArriveeEstimee;

    @NotNull(message = "Le nombre de places est obligatoire")
    @Min(value = 1, message = "Le nombre de places doit être au moins 1")
    @Max(value = 100, message = "Le nombre de places ne peut pas dépasser 100")
    private Integer nombrePlacesTotal;

    @NotNull(message = "Le montant est obligatoire")
    @DecimalMin(value = "0.01", message = "Le montant doit être positif")
    private BigDecimal montant;

    @DecimalMin(value = "0.0", message = "Le montant promotion doit être positif ou nul")
    private BigDecimal montantPromotion;

    @Size(max = 3, message = "La devise doit avoir 3 caractères maximum")
    private String devise;

    private String pointRendezvous;

    private String conditions;

    private Boolean annulationAutorisee;

    @Min(value = 0, message = "Le délai d'annulation doit être positif")
    private Integer delaiAnnulationHeures;
}