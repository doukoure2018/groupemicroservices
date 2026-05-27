package io.multi.immobilierservice.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class OrdrePhotoRequest {

    @NotEmpty
    private List<String> photoUuidsEnOrdre;     // UUIDs dans l'ordre d'affichage souhaité
}
