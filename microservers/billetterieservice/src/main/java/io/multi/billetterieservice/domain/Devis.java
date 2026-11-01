package io.multi.billetterieservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Le prix d'une réservation tel que le serveur le calcule, avant toute
 * commande. Le client affiche ces lignes et renvoie le total à payer à la
 * création : la commande est refusée si le prix a changé entre-temps.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Devis {
    private String offreUuid;
    private String devise;

    private int nombreAdultes;
    private int nombreEnfants;
    /** Bagages supplémentaires, au-delà de la franchise de chaque passager. */
    private int nombreBagages;
    /** Bagages en soute compris dans le prix, pour l'ensemble des passagers. */
    private int bagagesInclus;
    private boolean bagagesAutorises;

    private BigDecimal montantAdulte;
    private BigDecimal montantEnfant;
    private BigDecimal montantBagage;

    private List<LigneDevis> lignes;

    private BigDecimal montantPlaces;
    private BigDecimal montantBagages;
    private BigDecimal montantFraisService;
    /** Places + bagages + frais de service : ce que la commande enregistre comme total. */
    private BigDecimal montantTotal;
    /** Frais propres au mode de règlement choisi, 0 si aucun mode n'est encore choisi. */
    private BigDecimal montantFraisPaiement;
    /** Total + frais du mode : la somme réellement réglée. */
    private BigDecimal montantAPayer;

    /** Règle d'âge appliquée : enfant tant qu'il n'a pas cet âge le jour du voyage. */
    private int ageAdulteMinimum;
}
