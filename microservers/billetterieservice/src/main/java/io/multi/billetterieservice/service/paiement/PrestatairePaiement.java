package io.multi.billetterieservice.service.paiement;

import java.math.BigDecimal;

/**
 * Contrat commun à tous les prestataires de paiement. Trois opérations suffisent :
 * lancer, vérifier, et normaliser un montant selon les contraintes du prestataire.
 *
 * <p>Ajouter un moyen de paiement revient à écrire une implémentation et à
 * déclarer les codes de mode de règlement qu'elle traite. Aucun appelant ne
 * connaît le prestataire qui le sert.
 */
public interface PrestatairePaiement {

    /** Code technique, journalisé et conservé dans les métadonnées du paiement. */
    String code();

    /** Vrai si ce prestataire traite ce code de mode de règlement (OM, MOMO, CB…). */
    boolean supporte(String codeModeReglement);

    /**
     * Ajuste un montant aux contraintes du prestataire. CinetPay n'accepte que
     * les multiples de cinq ; un autre prestataire pourra ne rien changer.
     * À appeler AVANT d'enregistrer le montant, pour que la somme facturée soit
     * exactement celle que le client voit et que la base conserve.
     */
    BigDecimal normaliserMontant(BigDecimal montant);

    /** Lance le paiement et renvoie l'adresse vers laquelle envoyer le client. */
    ResultatInitiation initier(DemandePaiement demande);

    /**
     * Interroge le prestataire sur l'état réel d'une transaction. C'est la seule
     * source de vérité : une notification entrante est une requête HTTP comme une
     * autre, qu'un tiers peut fabriquer, et ne doit jamais être crue sur parole.
     *
     * <p>Deux références parce que les prestataires ne s'accordent pas :
     * CinetPay interroge avec la nôtre, qu'il a reçue à l'initiation, tandis que
     * Chap Chap Pay n'accepte que l'identifiant d'opération qu'il a lui-même
     * attribué. Chaque implémentation prend celle qui la concerne.
     *
     * @param reference            notre référence de paiement
     * @param referencePrestataire identifiant rendu par le prestataire, nul s'il n'en rend pas
     */
    EtatPaiement verifier(String reference, String referencePrestataire);
}
