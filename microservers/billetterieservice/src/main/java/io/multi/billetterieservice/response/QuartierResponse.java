package io.multi.billetterieservice.response;


import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuartierResponse {

    private Long quartierId;
    private String quartierUuid;
    private String libelle;
    private Boolean actif;

    // Informations de la commune parente
    private Long communeId;
    private String communeUuid;
    private String communeLibelle;

    // Informations de la ville (via la commune)
    private String villeUuid;
    private String villeLibelle;

    // Informations de la région (via la ville)
    private String regionUuid;
    private String regionLibelle;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
    private OffsetDateTime createdAt;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
    private OffsetDateTime updatedAt;
}
