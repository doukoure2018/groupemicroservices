package io.multi.billetterieservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModifierDateRequest {
    @NotBlank(message = "La nouvelle offre est obligatoire")
    private String nouvelleOffreUuid;
}
