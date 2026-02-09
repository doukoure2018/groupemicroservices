package io.multi.billetterieservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

/**
 * Entité représentant une offre de transport.
 * Une offre lie un trajet, un véhicule et un utilisateur propriétaire.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Offre {

    // ========== Champs de base ==========
    private Long offreId;
    private String offreUuid;
    private String tokenOffre;
    private Long trajetId;
    private Long vehiculeId;
    private Long userId;
    private LocalDate dateDepart;
    private LocalTime heureDepart;
    private LocalTime heureArriveeEstimee;
    private Integer nombrePlacesTotal;
    private Integer nombrePlacesDisponibles;
    private Integer nombrePlacesReservees;
    private BigDecimal montant;
    private BigDecimal montantPromotion;
    private String devise;
    private String statut;
    private Integer niveauRemplissage;
    private String pointRendezvous;
    private String conditions;
    private Boolean annulationAutorisee;
    private Integer delaiAnnulationHeures;
    private OffsetDateTime datePublication;
    private OffsetDateTime dateCloture;
    private OffsetDateTime dateDepartEffectif;
    private OffsetDateTime dateArriveeEffective;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // ========== Champs du Trajet (jointure) ==========
    private String trajetUuid;
    private String trajetLibelle;
    private BigDecimal trajetDistanceKm;
    private Integer trajetDureeMinutes;

    // ========== Champs du Départ (jointure via trajet) ==========
    private String departUuid;
    private String departLibelle;
    private String siteDepart;
    private String villeDepartLibelle;
    private String villeDepartUuid;
    private String regionDepartLibelle;

    // ========== Champs de l'Arrivée (jointure via trajet) ==========
    private String arriveeUuid;
    private String arriveeLibelle;
    private String siteArrivee;
    private String villeArriveeLibelle;
    private String villeArriveeUuid;
    private String regionArriveeLibelle;

    // ========== Champs du Véhicule (jointure) ==========
    private String vehiculeUuid;
    private String vehiculeImmatriculation;
    private String vehiculeMarque;
    private String vehiculeModele;
    private String vehiculeCouleur;
    private Integer vehiculeNombrePlaces;
    private Boolean vehiculeClimatise;
    private String vehiculeStatut;
    private String typeVehiculeLibelle;
    private String nomChauffeur;
    private String contactChauffeur;

    // ========== Champs de l'Utilisateur propriétaire (jointure) ==========
    private String userUuid;
    private String userUsername;
    private String userFullName;
    private String userEmail;
    private String userPhone;

    // ========== Champs calculés ==========
    /**
     * Retourne le montant effectif (promotion ou montant normal)
     */
    public BigDecimal getMontantEffectif() {
        if (montantPromotion != null && montantPromotion.compareTo(BigDecimal.ZERO) > 0) {
            return montantPromotion;
        }
        return montant;
    }

    /**
     * Vérifie si l'offre a une promotion active
     */
    public boolean hasPromotion() {
        return montantPromotion != null && montantPromotion.compareTo(BigDecimal.ZERO) > 0
                && montantPromotion.compareTo(montant) < 0;
    }

    /**
     * Calcule le pourcentage de réduction
     */
    public BigDecimal getPourcentageReduction() {
        if (!hasPromotion()) {
            return BigDecimal.ZERO;
        }
        return montant.subtract(montantPromotion)
                .multiply(new BigDecimal("100"))
                .divide(montant, 2, java.math.RoundingMode.HALF_UP);
    }
}