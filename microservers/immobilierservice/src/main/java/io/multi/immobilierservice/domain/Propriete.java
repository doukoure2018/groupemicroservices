package io.multi.immobilierservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Propriete {

    private Long proprieteId;
    private String proprieteUuid;
    private String reference;                  // BIEN-YYYYMMDD-XXXX (généré par trigger)
    private Long profilId;
    private Long agenceId;
    private String typeAnnonce;                // LOCATION | VENTE
    private String dureeLocation;              // COURT_SEJOUR | LONG_SEJOUR
    private Long typeBienId;
    private String titre;
    private String description;

    // Prix
    private BigDecimal prix;
    private String devise;                     // GNF | USD | EUR
    private String periode;                    // PAR_MOIS | PAR_AN | UNIQUE
    private Boolean prixSurDemande;
    private Boolean prixNegociable;

    // Caractéristiques
    private Integer nombreChambres;
    private Integer nombreSallesBain;
    private BigDecimal surfaceM2;
    private Integer nombreEtages;
    private Integer etageSituation;
    private Integer anneeConstruction;

    // Conditions location
    private Integer moisCaution;
    private Integer moisAvance;
    private Integer moisHonoraire;

    // Localisation
    private Long localisationId;
    private String adresseComplete;
    private Double latitude;
    private Double longitude;
    private Boolean afficherAdresseExacte;

    // Cycle de vie
    private LocalDate dateDisponibilite;
    private String statut;
    private OffsetDateTime datePublication;
    private OffsetDateTime dateExpiration;
    private Integer nombreRenouvellements;
    private String motifRejet;

    // Contact public
    private String nomContactPublic;
    private String telephoneContact;

    // Stats
    private Integer nombreVues;
    private Integer nombreFavoris;
    private Integer nombreContacts;

    // Premium (champs réservés - non implémentés en Phase 6)
    private Boolean premium;
    private OffsetDateTime datePremiumFin;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Associations enrichies (chargées par services, pas par RowMapper)
    private TypeBien typeBien;
    private List<Photo> photos;
    private List<Commodite> commodites;
    private Photo photoCouverture;
}
