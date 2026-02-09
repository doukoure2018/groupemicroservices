package io.multi.billetterieservice.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO pour la création et mise à jour d'un véhicule.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehiculeRequest {

    // Type de véhicule (optionnel)
    private String typeVehiculeUuid;

    @NotBlank(message = "L'immatriculation est obligatoire")
    @Size(max = 20, message = "L'immatriculation ne doit pas dépasser 20 caractères")
    private String immatriculation;

    @Size(max = 50, message = "La marque ne doit pas dépasser 50 caractères")
    private String marque;

    @Size(max = 50, message = "Le modèle ne doit pas dépasser 50 caractères")
    private String modele;

    @Min(value = 1900, message = "L'année de fabrication doit être valide")
    @Max(value = 2100, message = "L'année de fabrication doit être valide")
    private Integer anneeFabrication;

    @NotNull(message = "Le nombre de places est obligatoire")
    @Min(value = 1, message = "Le nombre de places doit être au moins 1")
    @Max(value = 100, message = "Le nombre de places ne peut pas dépasser 100")
    private Integer nombrePlaces;

    @NotBlank(message = "Le nom du chauffeur est obligatoire")
    @Size(max = 100, message = "Le nom du chauffeur ne doit pas dépasser 100 caractères")
    private String nomChauffeur;

    @NotBlank(message = "Le contact du chauffeur est obligatoire")
    @Size(max = 20, message = "Le contact du chauffeur ne doit pas dépasser 20 caractères")
    private String contactChauffeur;

    @Size(max = 20, message = "Le contact du propriétaire ne doit pas dépasser 20 caractères")
    private String contactProprietaire;

    private String description;

    @Size(max = 30, message = "La couleur ne doit pas dépasser 30 caractères")
    private String couleur;

    private Boolean climatise;

    @Size(max = 255, message = "L'URL de l'image ne doit pas dépasser 255 caractères")
    private String imageUrl;

    @Size(max = 255, message = "L'URL du document d'assurance ne doit pas dépasser 255 caractères")
    private String documentAssuranceUrl;

    private LocalDate dateExpirationAssurance;

    @Size(max = 255, message = "L'URL du document de visite technique ne doit pas dépasser 255 caractères")
    private String documentVisiteTechniqueUrl;

    private LocalDate dateExpirationVisite;

    @Pattern(regexp = "^(ACTIF|INACTIF|EN_MAINTENANCE|SUSPENDU)$",
            message = "Le statut doit être ACTIF, INACTIF, EN_MAINTENANCE ou SUSPENDU")
    private String statut;
}