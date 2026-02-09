package io.multi.billetterieservice.domain;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Localisation {

    private Long localisationId;
    private String localisationUuid;
    private Long quartierId;
    private String adresseComplete;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String description;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Champs additionnels pour les jointures (nullable car quartier_id est nullable)
    private String quartierUuid;
    private String quartierLibelle;
    private String communeUuid;
    private String communeLibelle;
    private String villeUuid;
    private String villeLibelle;
    private String regionUuid;
    private String regionLibelle;
}

