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
public class TypeVehicule {

    private Long typeVehiculeId;
    private String typeVehiculeUuid;
    private String libelle;
    private String description;
    private Integer capaciteMin;
    private Integer capaciteMax;
    /** Gabarit du plan de sièges : BUS, MINIBUS ou VOITURE. */
    private String gabarit;
    private Boolean actif;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}