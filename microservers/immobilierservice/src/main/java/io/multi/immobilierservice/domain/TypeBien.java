package io.multi.immobilierservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypeBien {

    private Long typeBienId;
    private String typeBienUuid;
    private String code;               // MAISON | APPARTEMENT | IMMEUBLE | TERRAIN | BUREAU | BOUTIQUE | CHAMBRE
    private String libelle;
    private String description;
    private String icone;
    private Integer ordreAffichage;
    private Boolean actif;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
