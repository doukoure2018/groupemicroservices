package io.multi.billetterieservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Entité représentant un partenaire commercial.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Partenaire {

    // ========== Champs de base ==========
    private Long partenaireId;
    private String partenaireUuid;
    private Long localisationId;
    private String nom;
    private String typePartenaire;
    private String raisonSociale;
    private String numeroRegistre;
    private String telephone;
    private String email;
    private String adresse;
    private String logoUrl;
    private BigDecimal commissionPourcentage;
    private BigDecimal commissionFixe;
    private String responsableNom;
    private String responsableTelephone;
    private String statut;
    private LocalDate dateDebutPartenariat;
    private LocalDate dateFinPartenariat;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // ========== Champs de la Localisation (jointure) ==========
    private String localisationUuid;
    private String localisationAdresseComplete;
    private Double localisationLatitude;
    private Double localisationLongitude;
    private String quartierLibelle;
    private String communeLibelle;
    private String villeLibelle;
    private String villeUuid;
    private String regionLibelle;
}