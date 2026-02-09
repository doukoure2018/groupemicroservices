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
public class QuartierCreateRequest {

    @NotBlank(message = "L'UUID de la commune est obligatoire")
    private String communeUuid;

    @NotBlank(message = "Le libellé du quartier est obligatoire")
    @Size(min = 2, max = 100, message = "Le libellé doit contenir entre 2 et 100 caractères")
    private String libelle;
}
