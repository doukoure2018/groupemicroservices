package io.multi.billetterieservice.service.paiement;

/**
 * Résultat d'une initiation de paiement.
 *
 * @param urlPaiement           adresse où envoyer le client pour qu'il paie
 * @param referencePrestataire  identifiant attribué par le prestataire, conservé
 *                              pour le rapprochement et le support
 */
public record ResultatInitiation(String urlPaiement, String referencePrestataire) {
}
