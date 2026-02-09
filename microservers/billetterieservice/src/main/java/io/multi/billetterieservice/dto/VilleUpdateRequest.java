package io.multi.billetterieservice.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VilleUpdateRequest {

    @NotBlank(message = "Le libellé de la ville est obligatoire")
    @Size(min = 2, max = 100, message = "Le libellé doit contenir entre 2 et 100 caractères")
    private String libelle;

    @Size(max = 10, message = "Le code postal ne doit pas dépasser 10 caractères")
    private String codePostal;

    // Optionnel: permet de changer la région de la ville
    private String regionUuid;
}
