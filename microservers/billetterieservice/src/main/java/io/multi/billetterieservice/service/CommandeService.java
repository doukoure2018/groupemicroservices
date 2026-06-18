package io.multi.billetterieservice.service;

import io.multi.billetterieservice.domain.Commande;
import io.multi.billetterieservice.domain.Offre;
import io.multi.billetterieservice.dto.CommandeRequest;

import java.util.List;

public interface CommandeService {

    Commande creerCommande(CommandeRequest request, Long userId);

    Commande getByUuid(String commandeUuid);

    List<Commande> getCommandesByUserId(Long userId);

    Commande annulerCommande(String commandeUuid, Long userId);

    /** Offres du même trajet (futures, OUVERT, assez de places) vers lesquelles déplacer la commande. */
    List<Offre> getOffresAlternatives(String commandeUuid, Long userId);

    /** Déplace la commande vers une autre offre du même trajet (changement de date). */
    Commande modifierDateCommande(String commandeUuid, String nouvelleOffreUuid, Long userId);
}
