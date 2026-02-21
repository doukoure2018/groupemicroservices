package io.multi.billetterieservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * Entite representant un avis voyageur.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Avis {

    private Long avisId;
    private String avisUuid;
    private Long userId;
    private Long commandeId;
    private Long vehiculeId;
    private Integer note;
    private String commentaire;
    private String reponse;
    private OffsetDateTime dateReponse;
    private Boolean visible;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Jointure users
    private String userFullName;
}
