package io.multi.immobilierservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/** Déclaration de besoin depuis l'app mobile (V32). */
@Data
public class DemandeCreateRequest {

    @NotBlank
    @Pattern(regexp = "LOCATION|ACHAT")
    private String typeAnnonce;

    private Long typeBienId;

    /** Commune du référentiel… */
    private Long communeId;

    /** …ou saisie libre si absente du référentiel (au moins l'un des deux requis). */
    @Size(max = 100)
    private String communeTexte;

    private Long quartierId;

    @Size(max = 100)
    private String quartierTexte;

    private BigDecimal budgetMin;

    private BigDecimal budgetMax;

    @Size(max = 3)
    private String devise;              // défaut GNF

    private Integer nbChambresMin;

    private List<Long> commoditeIds;    // ex. cour fermée

    @Size(max = 2000)
    private String description;         // autres spécificités

    @Size(max = 20)
    private String contactTelephone;

    @Size(max = 20)
    private String contactWhatsapp;
}
