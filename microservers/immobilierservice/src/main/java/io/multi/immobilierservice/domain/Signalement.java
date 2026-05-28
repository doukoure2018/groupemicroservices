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
public class Signalement {

    private Long signalementId;
    private String signalementUuid;
    private Long userId;             // auteur du signalement
    private Long proprieteId;
    private String motif;            // FAUX | INAPPROPRIE | DEJA_VENDU | ARNAQUE | AUTRE
    private String description;
    private String statut;           // EN_ATTENTE | TRAITE | REJETE
    private Long traitePar;          // user admin
    private OffsetDateTime dateTraitement;
    private String notesAdmin;
    private OffsetDateTime createdAt;
}
