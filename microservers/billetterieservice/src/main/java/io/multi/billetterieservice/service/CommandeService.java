package io.multi.billetterieservice.service;

import io.multi.billetterieservice.domain.Commande;
import io.multi.billetterieservice.domain.Offre;
import io.multi.billetterieservice.dto.CommandeRequest;

import java.util.List;

public interface CommandeService {

    Commande creerCommande(CommandeRequest request, Long userId);

    /**
     * Traite le résultat d'un paiement en ligne pour une référence donnée.
     * Interroge le prestataire — seule source de vérité — puis confirme ou
     * annule la commande. Idempotent : un prestataire peut notifier plusieurs
     * fois le même encaissement.
     */
    Commande confirmerPaiement(String referencePaiement);

    /**
     * Abandonne une commande restée en attente de paiement : billets annulés,
     * paiement marqué échoué, places rendues par le déclencheur. Sans jamais
     * toucher à une commande déjà tranchée.
     */
    void expirerCommande(String referencePaiement);

    Commande getByUuid(String commandeUuid);

    List<Commande> getCommandesByUserId(Long userId);

    Commande annulerCommande(String commandeUuid, Long userId);

    /** Offres du même trajet (futures, OUVERT, assez de places) vers lesquelles déplacer la commande. */
    List<Offre> getOffresAlternatives(String commandeUuid, Long userId);

    /** Déplace la commande vers une autre offre du même trajet (changement de date). */
    Commande modifierDateCommande(String commandeUuid, String nouvelleOffreUuid, Long userId);
}
