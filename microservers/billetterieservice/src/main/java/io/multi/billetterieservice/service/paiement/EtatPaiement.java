package io.multi.billetterieservice.service.paiement;

/** État d'une transaction chez le prestataire, indépendant de son vocabulaire propre. */
public enum EtatPaiement {
    /** Le client n'a pas encore confirmé, ou le prestataire n'a pas encore tranché. */
    EN_ATTENTE,
    /** Fonds encaissés. Seul cet état autorise la confirmation de la commande. */
    REUSSI,
    /** Refusé, annulé, expiré ou solde insuffisant. */
    ECHOUE
}
