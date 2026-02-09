package io.multi.billetterieservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Entité représentant un mode de règlement (Espèces, Orange Money, Wave, etc.)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModeReglement {

    private Long modeReglementId;
    private String modeReglementUuid;
    private String libelle;
    private String code;
    private String description;
    private String iconeUrl;
    private BigDecimal fraisPourcentage;
    private BigDecimal fraisFixe;
    private Boolean actif;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}