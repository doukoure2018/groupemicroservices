package io.multi.immobilierservice.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class ProprieteUpdateRequest {

    @Size(max = 200)
    private String titre;

    @Size(max = 1500)
    private String description;

    @Pattern(regexp = "COURT_SEJOUR|LONG_SEJOUR")
    private String dureeLocation;

    @DecimalMin(value = "0", inclusive = false)
    private BigDecimal prix;

    private String devise;

    @Pattern(regexp = "PAR_MOIS|PAR_AN|UNIQUE")
    private String periode;

    private Boolean prixSurDemande;
    private Boolean prixNegociable;

    @Min(0) @Max(50)
    private Integer nombreChambres;

    @Min(0) @Max(50)
    private Integer nombreSallesBain;

    @DecimalMin("0")
    private BigDecimal surfaceM2;

    private Integer nombreEtages;
    private Integer etageSituation;
    private Integer anneeConstruction;

    private Integer moisCaution;
    private Integer moisAvance;
    private Integer moisHonoraire;

    private String localisationUuid;
    @Size(max = 500)
    private String adresseComplete;
    private Double latitude;
    private Double longitude;
    private Boolean afficherAdresseExacte;

    private LocalDate dateDisponibilite;

    @Size(max = 150)
    private String nomContactPublic;
    @Size(max = 20)
    private String telephoneContact;

    private List<String> commoditesCodes;
}
