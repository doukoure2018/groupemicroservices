package io.multi.immobilierservice.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AnnulerVisiteRequest {

    @Size(max = 500)
    private String motifAnnulation;
}
