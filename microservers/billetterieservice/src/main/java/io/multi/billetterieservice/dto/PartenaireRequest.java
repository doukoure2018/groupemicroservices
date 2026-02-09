package io.multi.billetterieservice.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO pour la création et mise à jour d'un partenaire.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartenaireRequest {

    // Localisation (optionnelle)
    private String localisationUuid;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 100, message = "Le nom ne doit pas dépasser 100 caractères")
    private String nom;

    @Size(max = 50, message = "Le type de partenaire ne doit pas dépasser 50 caractères")
    @Pattern(regexp = "^(AGENCE|TRANSPORTEUR|REVENDEUR|GUICHET|AUTRE)?$",
            message = "Le type doit être AGENCE, TRANSPORTEUR, REVENDEUR, GUICHET ou AUTRE")
    private String typePartenaire;

    @Size(max = 150, message = "La raison sociale ne doit pas dépasser 150 caractères")
    private String raisonSociale;

    @Size(max = 50, message = "Le numéro de registre ne doit pas dépasser 50 caractères")
    private String numeroRegistre;

    @Size(max = 20, message = "Le téléphone ne doit pas dépasser 20 caractères")
    private String telephone;

    @Email(message = "L'email doit être valide")
    @Size(max = 100, message = "L'email ne doit pas dépasser 100 caractères")
    private String email;

    private String adresse;

    @Size(max = 255, message = "L'URL du logo ne doit pas dépasser 255 caractères")
    private String logoUrl;

    @DecimalMin(value = "0.0", message = "La commission en pourcentage doit être positive")
    @DecimalMax(value = "100.0", message = "La commission en pourcentage ne peut pas dépasser 100%")
    private BigDecimal commissionPourcentage;

    @DecimalMin(value = "0.0", message = "La commission fixe doit être positive")
    private BigDecimal commissionFixe;

    @Size(max = 100, message = "Le nom du responsable ne doit pas dépasser 100 caractères")
    private String responsableNom;

    @Size(max = 20, message = "Le téléphone du responsable ne doit pas dépasser 20 caractères")
    private String responsableTelephone;

    @Pattern(regexp = "^(ACTIF|INACTIF|SUSPENDU|EN_ATTENTE)?$",
            message = "Le statut doit être ACTIF, INACTIF, SUSPENDU ou EN_ATTENTE")
    private String statut;

    private LocalDate dateDebutPartenariat;

    private LocalDate dateFinPartenariat;
}