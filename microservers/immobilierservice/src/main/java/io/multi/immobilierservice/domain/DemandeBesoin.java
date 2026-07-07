package io.multi.immobilierservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Déclaration de besoin d'un client (V32) : diffusée aux agences vérifiées
 * de la zone (commune, fallback région, fallback toutes).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DemandeBesoin {

    private Long demandeId;
    private String demandeUuid;
    private String reference;              // DEM-YYYYMMDD-XXXX
    private Long userId;
    private String typeAnnonce;            // LOCATION | ACHAT
    private Long typeBienId;
    private Long communeId;
    private String communeTexte;           // saisie libre si hors référentiel (V34)
    private Long quartierId;
    private String quartierTexte;          // saisie libre si hors référentiel (V34)
    private BigDecimal budgetMin;
    private BigDecimal budgetMax;
    private String devise;
    private Integer nbChambresMin;
    private String commoditeIdsJson;       // JSONB en String, ex. [1,4]
    private String description;
    private String contactTelephone;
    private String contactWhatsapp;
    private String statut;                 // ACTIVE | POURVUE | ANNULEE | EXPIREE
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Champs enrichis (jointures référentiel, lecture seule)
    private String communeLibelle;
    private String quartierLibelle;
    private String typeBienLibelle;
    private Long regionId;
    private String regionLibelle;
}
