package io.multi.immobilierservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Visite {

    private Long visiteId;
    private String visiteUuid;
    private Long proprieteId;
    private Long visiteurUserId;
    private LocalDate dateVisite;
    private LocalTime heureVisite;
    private String statut;             // DEMANDEE | CONFIRMEE | EFFECTUEE | ANNULEE
    private String notesVisiteur;
    private String notesVendeur;
    private String motifAnnulation;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
