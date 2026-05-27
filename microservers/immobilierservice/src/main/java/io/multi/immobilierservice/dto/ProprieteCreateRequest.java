package io.multi.immobilierservice.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class ProprieteCreateRequest {

    @NotBlank
    @Pattern(regexp = "LOCATION|VENTE")
    private String typeAnnonce;

    @Pattern(regexp = "COURT_SEJOUR|LONG_SEJOUR")
    private String dureeLocation;       // requis si LOCATION

    @NotBlank
    private String typeBienCode;        // MAISON, APPARTEMENT, ...

    @Size(max = 200)
    private String titre;

    @Size(max = 1500)
    private String description;

    // Prix
    @DecimalMin(value = "0", inclusive = false)
    private BigDecimal prix;

    @Size(min = 3, max = 3)
    private String devise = "GNF";

    @Pattern(regexp = "PAR_MOIS|PAR_AN|UNIQUE")
    private String periode;

    private Boolean prixSurDemande = false;
    private Boolean prixNegociable = false;

    // Caractéristiques
    @Min(0) @Max(50)
    private Integer nombreChambres = 0;

    @Min(0) @Max(50)
    private Integer nombreSallesBain = 1;

    @DecimalMin("0")
    private BigDecimal surfaceM2;

    private Integer nombreEtages;
    private Integer etageSituation;
    private Integer anneeConstruction;

    // Conditions location
    private Integer moisCaution;
    private Integer moisAvance;
    private Integer moisHonoraire;

    // Localisation
    private String localisationUuid;    // FK vers localisations existante
    @Size(max = 500)
    private String adresseComplete;
    private Double latitude;
    private Double longitude;
    private Boolean afficherAdresseExacte = false;

    private LocalDate dateDisponibilite;

    // Contact public
    @Size(max = 150)
    private String nomContactPublic;
    @Size(max = 20)
    private String telephoneContact;

    // Commodités (codes)
    private List<String> commoditesCodes;
}
