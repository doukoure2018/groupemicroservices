package io.multi.billetterieservice.dto;


import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiteRequest {

    @NotBlank(message = "L'UUID de la localisation est obligatoire")
    private String localisationUuid;

    @NotBlank(message = "Le nom du site est obligatoire")
    @Size(min = 2, max = 100, message = "Le nom doit contenir entre 2 et 100 caractères")
    private String nom;

    private String description;

    @Size(max = 50, message = "Le type de site ne doit pas dépasser 50 caractères")
    private String typeSite;

    @Min(value = 0, message = "La capacité doit être positive")
    private Integer capaciteVehicules;

    @Size(max = 20, message = "Le téléphone ne doit pas dépasser 20 caractères")
    private String telephone;

    @Email(message = "L'email doit être valide")
    @Size(max = 100, message = "L'email ne doit pas dépasser 100 caractères")
    private String email;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime horaireOuverture;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime horaireFermeture;

    @Size(max = 255, message = "L'URL de l'image ne doit pas dépasser 255 caractères")
    private String imageUrl;

    private Boolean actif;
}