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
public class Paiement {

    private Long paiementId;
    private String paiementUuid;
    private Long commandeId;
    private Long modeReglementId;
    private BigDecimal montant;
    private String devise;
    private String referenceExterne;
    private String statut;
    private OffsetDateTime dateTransaction;
    private OffsetDateTime dateConfirmation;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
