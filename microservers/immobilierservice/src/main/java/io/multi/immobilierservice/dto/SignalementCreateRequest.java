package io.multi.immobilierservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SignalementCreateRequest {

    @NotBlank
    @Pattern(regexp = "FAUX|INAPPROPRIE|DEJA_VENDU|ARNAQUE|AUTRE",
            message = "motif doit être FAUX, INAPPROPRIE, DEJA_VENDU, ARNAQUE ou AUTRE")
    private String motif;

    @Size(max = 2000)
    private String description;
}
