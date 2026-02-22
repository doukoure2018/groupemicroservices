package io.multi.notificationserver.domain;

import lombok.*;

@Setter
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Data {

    private String name;
    private String email;
    private String token;
    private String ticketTitle;
    private String ticketNumber;
    private String priority;
    private String comment;
    private String date;
    private String files;

    private String phone;

    // Champs commande/billetterie
    private String numeroCommande;
    private String trajet;
    private String dateDepart;
    private String heureDepart;
    private String nombrePlaces;
    private String montantPaye;
    private String billetCodes;
    private String referencePaiement;
    private String userEmail; // email de l'utilisateur qui a réservé

    // Champs notifications programmees
    private String pointRendezVous;
    private String niveauRemplissage;
    private String codeBillet;
    private String nomPassager;
}