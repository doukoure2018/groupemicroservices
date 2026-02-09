package io.multi.billetterieservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Entité représentant un trajet entre un point de départ et un point d'arrivée.
 * Un trajet définit un itinéraire avec sa tarification de base.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Trajet {

    // ========== Champs de base ==========
    private Long trajetId;
    private String trajetUuid;
    private Long departId;
    private Long arriveeId;
    private Long userId;
    private String libelleTrajet;
    private BigDecimal distanceKm;
    private Integer dureeEstimeeMinutes;
    private BigDecimal montantBase;
    private BigDecimal montantBagages;
    private String devise;
    private String description;
    private String instructions;
    private Boolean actif;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // ========== Champs du Départ (jointure) ==========
    private String departUuid;
    private String departLibelle;
    private Long departSiteId;
    private String departSiteUuid;
    private String departSiteNom;
    private String departAdresseComplete;
    private Double departLatitude;
    private Double departLongitude;
    private String departVilleUuid;
    private String departVilleLibelle;
    private String departRegionLibelle;

    // ========== Champs de l'Arrivée (jointure) ==========
    private String arriveeUuid;
    private String arriveeLibelle;
    private Long arriveeSiteId;
    private String arriveeSiteUuid;
    private String arriveeSiteNom;
    private String arriveeAdresseComplete;
    private Double arriveeLatitude;
    private Double arriveeLongitude;
    private String arriveeVilleUuid;
    private String arriveeVilleLibelle;
    private String arriveeRegionLibelle;

    // ========== Champs de l'Utilisateur créateur (jointure) ==========
    private String userUuid;
    private String userUsername;
    private String userFullName;
}