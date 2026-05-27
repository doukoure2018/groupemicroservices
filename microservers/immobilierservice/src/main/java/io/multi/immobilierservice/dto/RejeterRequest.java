package io.multi.immobilierservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RejeterRequest {

    @NotBlank
    @Size(max = 500)
    private String motif;
}
