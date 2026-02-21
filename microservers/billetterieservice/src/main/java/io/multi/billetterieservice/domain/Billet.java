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
public class Billet {

    private Long billetId;
    private String billetUuid;
    private Long commandeId;
    private String codeBillet;
    private String numeroSiege;
    private String nomPassager;
    private String telephonePassager;
    private String pieceIdentite;
    private String statut;
    private OffsetDateTime dateValidation;
    private Long validePar;
    private String qrCodeData;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
