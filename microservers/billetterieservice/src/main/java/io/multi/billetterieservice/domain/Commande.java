package io.multi.billetterieservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Commande {

    private Long commandeId;
    private String commandeUuid;
    private String numeroCommande;
    private Long offreId;
    private Long userId;
    private Long modeReglementId;
    private Integer nombrePlaces;
    private BigDecimal montantUnitaire;
    private BigDecimal montantTotal;
    private BigDecimal montantFrais;
    private BigDecimal montantRemise;
    private BigDecimal montantPaye;
    private String devise;
    private String statut;
    private OffsetDateTime dateReservation;
    private OffsetDateTime dateConfirmation;
    private OffsetDateTime datePaiement;
    private String referencePaiement;
    private String notes;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Champs jointure (offre)
    private String offreUuid;
    private LocalDate dateDepart;
    private LocalTime heureDepart;
    private String villeDepartLibelle;
    private String villeArriveeLibelle;
    private String siteDepart;
    private String siteArrivee;

    // Champs jointure (vehicule)
    private String vehiculeImmatriculation;
    private String nomChauffeur;
    private String contactChauffeur;

    // Champs jointure (offre enrichie)
    private Integer niveauRemplissage;
    private String pointRendezVous;
    private String typeVehicule;

    // Billets associes
    private List<Billet> billets;
}
