package io.multi.billetterieservice.dto;


import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArriveeRequest {

    @NotBlank(message = "L'UUID du site d'arrivée est obligatoire")
    private String siteUuid;

    @NotBlank(message = "L'UUID du départ est obligatoire")
    private String departUuid;

    @NotBlank(message = "Le libellé est obligatoire")
    @Size(min = 2, max = 100, message = "Le libellé doit contenir entre 2 et 100 caractères")
    private String libelle;

    @Size(max = 100, message = "Le libellé du départ ne doit pas dépasser 100 caractères")
    private String libelleDepart;

    private String description;

    @Min(value = 0, message = "L'ordre d'affichage doit être positif")
    private Integer ordreAffichage;

    private Boolean actif;
}

