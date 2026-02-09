package io.multi.billetterieservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegionStatusRequest {

    @NotNull(message = "Le statut actif est obligatoire")
    private Boolean actif;
}
