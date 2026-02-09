package io.multi.billetterieservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Commune {

    private Long communeId;
    private String communeUuid;
    private Long villeId;
    private String libelle;
    private Boolean actif;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Champs additionnels pour les jointures
    private String villeUuid;
    private String villeLibelle;
    private String regionUuid;
    private String regionLibelle;
}

