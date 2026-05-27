package io.multi.immobilierservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AgenceRequest {

    @NotBlank
    @Size(max = 150)
    private String nom;

    @Size(max = 200)
    private String raisonSociale;

    @Size(max = 50)
    private String numeroRegistre;

    @Size(max = 500)
    private String logoUrl;

    @Size(max = 20)
    private String telephone;

    @Email
    @Size(max = 150)
    private String email;

    private String localisationUuid;       // FK vers localisations

    private String description;

    @Size(max = 255)
    private String siteWeb;

    private String reseauxSociauxJson;     // JSON string

    @Size(max = 500)
    private String documentsKycUrl;

    private LocalDate dateCreationAgence;
}
