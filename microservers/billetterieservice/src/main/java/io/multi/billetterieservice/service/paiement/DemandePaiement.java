package io.multi.billetterieservice.service.paiement;

import lombok.Builder;

import java.math.BigDecimal;

/**
 * Demande de paiement envoyée à un prestataire. Volontairement neutre : aucun
 * champ propre à CinetPay, pour qu'un autre prestataire (Soutra Money, Kulu…)
 * se branche sans toucher aux appelants.
 *
 * @param reference      identifiant de la transaction côté SYNERGIA, unique et stable
 * @param montant        montant à encaisser, déjà normalisé par le prestataire
 * @param devise         code ISO, « GNF » en Guinée
 * @param urlNotification adresse que le prestataire appellera pour annoncer le résultat
 * @param urlRetour      adresse vers laquelle le client revient après paiement
 */
@Builder
public record DemandePaiement(
        String reference,
        BigDecimal montant,
        String devise,
        String description,
        String clientNom,
        String clientPrenom,
        String clientEmail,
        String clientTelephone,
        String urlRetour,
        String urlNotification
) {
}
