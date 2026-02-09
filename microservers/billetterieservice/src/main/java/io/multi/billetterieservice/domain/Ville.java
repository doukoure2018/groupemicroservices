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
public class Ville {

    private Long villeId;
    private String villeUuid;
    private Long regionId;
    private String libelle;
    private String codePostal;
    private Boolean actif;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Champs additionnels pour les jointures
    private String regionLibelle;
    private String regionUuid;
}
