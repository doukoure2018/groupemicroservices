package io.multi.billetterieservice.dto;


import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartRequest {

    @NotBlank(message = "L'UUID du site est obligatoire")
    private String siteUuid;

    @NotBlank(message = "Le libellé est obligatoire")
    @Size(min = 2, max = 100, message = "Le libellé doit contenir entre 2 et 100 caractères")
    private String libelle;

    private String description;

    @Min(value = 0, message = "L'ordre d'affichage doit être positif")
    private Integer ordreAffichage;

    private Boolean actif;
}




