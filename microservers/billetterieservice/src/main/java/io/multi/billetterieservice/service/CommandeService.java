package io.multi.billetterieservice.service;

import io.multi.billetterieservice.domain.Commande;
import io.multi.billetterieservice.dto.CommandeRequest;

import java.util.List;

public interface CommandeService {

    Commande creerCommande(CommandeRequest request, Long userId);

    Commande getByUuid(String commandeUuid);

    List<Commande> getCommandesByUserId(Long userId);

    Commande annulerCommande(String commandeUuid, Long userId);
}
