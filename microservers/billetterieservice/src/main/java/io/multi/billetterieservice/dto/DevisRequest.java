package io.multi.billetterieservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Composition d'une réservation à chiffrer, avant de saisir quoi que ce soit. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DevisRequest {

    @NotBlank(message = "L'offre est obligatoire")
    private String offreUuid;

    @Min(value = 1, message = "Au moins un adulte doit voyager")
    @Max(value = 8, message = "Huit places au plus par réservation")
    private int nombreAdultes = 1;

    @Min(value = 0, message = "Le nombre d'enfants ne peut pas être négatif")
    @Max(value = 7, message = "Huit places au plus par réservation")
    private int nombreEnfants;

    @Min(value = 0, message = "Le nombre de bagages ne peut pas être négatif")
    @Max(value = 10, message = "Dix bagages supplémentaires au plus")
    private int nombreBagages;

    /** Facultatif : sans mode, les frais de paiement sont à zéro et le total est provisoire. */
    private String modeReglementCode;
}
