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
public class Commodite {

    private Long commoditeId;
    private String commoditeUuid;
    private String code;
    private String libelle;
    private String categorie;          // CONFORT | SECURITE | EXTERIEUR
    private String icone;
    private Integer ordreAffichage;
    private Boolean actif;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
