package io.multi.billetterieservice.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VilleCreateRequest {

    @NotBlank(message = "L'UUID de la région est obligatoire")
    private String regionUuid;

    @NotBlank(message = "Le libellé de la ville est obligatoire")
    @Size(min = 2, max = 100, message = "Le libellé doit contenir entre 2 et 100 caractères")
    private String libelle;

    @Size(max = 10, message = "Le code postal ne doit pas dépasser 10 caractères")
    private String codePostal;
}
