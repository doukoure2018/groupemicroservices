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
    private Boolean actif;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}