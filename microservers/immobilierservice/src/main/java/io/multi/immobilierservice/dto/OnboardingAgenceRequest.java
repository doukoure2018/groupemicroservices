package io.multi.immobilierservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Informations complémentaires demandées à une agence après son inscription
 * (rôle ADMIN_IMMO), avant soumission à la conformité. Cf. V31.
 */
@Data
public class OnboardingAgenceRequest {

    @NotBlank
    @Size(max = 150)
    private String nom;

    @Size(max = 200)
    private String raisonSociale;

    /** RCCM ou code NIF. */
    @NotBlank
    @Size(max = 50)
    private String numeroRegistre;

    @NotBlank
    @Size(max = 255)
    private String adresse;

    @NotNull
    private Long communeId;

    @NotNull
    private Long regionId;

    /** Email professionnel. */
    @NotBlank
    @Email
    @Size(max = 150)
    private String email;

    /** Contact pour joindre l'agence. */
    @NotBlank
    @Size(max = 20)
    private String telephone;

    @Size(max = 20)
    private String telephoneWhatsapp;

    private String description;
}
