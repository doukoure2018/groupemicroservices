package io.multi.immobilierservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

@Data
public class BrouillonSaveRequest {

    @NotNull
    @Min(1) @Max(4)
    private Integer etapeActuelle;

    /**
     * Structure libre du formulaire (steps Bien/Lieu/Prix/Photos).
     * Le backend ne valide pas le contenu — c'est juste persisté en JSONB.
     */
    @NotNull
    private Map<String, Object> donneesJson;
}
