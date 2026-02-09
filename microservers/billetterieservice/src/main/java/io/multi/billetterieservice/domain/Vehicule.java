package io.multi.billetterieservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Entité représentant un véhicule de transport.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Vehicule {

    // ========== Champs de base ==========
    private Long vehiculeId;
    private String vehiculeUuid;
    private Long userId;
    private Long typeVehiculeId;
    private String immatriculation;
    private String marque;
    private String modele;
    private Integer anneeFabrication;
    private Integer nombrePlaces;
    private String nomChauffeur;
    private String contactChauffeur;
    private String contactProprietaire;
    private String description;
    private String couleur;
    private Boolean climatise;
    private String imageUrl;
    private byte[] imageData;
    private String imageType;
    private String documentAssuranceUrl;
    private LocalDate dateExpirationAssurance;
    private String documentVisiteTechniqueUrl;
    private LocalDate dateExpirationVisite;
    private String statut;
    private BigDecimal noteMoyenne;
    private Integer nombreAvis;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // ========== Champs du Type de Véhicule (jointure) ==========
    private String typeVehiculeUuid;
    private String typeVehiculeLibelle;
    private String typeVehiculeDescription;
    private Integer typeVehiculeCapaciteMin;
    private Integer typeVehiculeCapaciteMax;

    // ========== Champs de l'Utilisateur propriétaire (jointure) ==========
    private String userUuid;
    private String userUsername;
    private String userFullName;
    private String userEmail;
    private String userPhone;
}