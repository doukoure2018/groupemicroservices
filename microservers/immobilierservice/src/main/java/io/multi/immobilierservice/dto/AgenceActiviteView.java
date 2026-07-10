package io.multi.immobilierservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/** Agence enrichie de ses compteurs d'activité (écran admin « Agences »). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgenceActiviteView {
    private String agenceUuid;
    private String nom;
    private String raisonSociale;
    private String numeroRegistre;
    private String email;
    private String telephone;
    private String statutVerification;
    private Long proprietaireUserId;
    private String communeLibelle;
    private String regionLibelle;
    private OffsetDateTime createdAt;
    private OffsetDateTime dateSoumissionConformite;

    // Compteurs d'activité
    private long nbAnnoncesTotal;
    private long nbAnnoncesPubliees;
    private long nbAgents;

    // Résolu via Feign UserClient (nom du représentant = propriétaire du compte)
    private String representantNom;
}
