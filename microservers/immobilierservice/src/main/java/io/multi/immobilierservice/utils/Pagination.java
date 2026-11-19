package io.multi.immobilierservice.utils;

/**
 * Bornes de pagination appliquées au plus près du SQL.
 *
 * <p>Les listes du service acceptaient n'importe quel entier : une seule requête
 * avec {@code limit=10000000} faisait remonter toute la table en mémoire. Les
 * bornes sont posées ici, au moment de lier les paramètres, pour qu'aucune
 * requête n'y échappe, quelle que soit la ressource appelante.
 *
 * <p>La valeur demandée est ramenée dans l'intervalle plutôt que refusée : les
 * clients existants continuent de fonctionner, ils reçoivent simplement une page.
 */
public final class Pagination {

    /** Page rendue quand l'appelant ne demande rien de sensé. */
    public static final int LIMITE_PAR_DEFAUT = 20;

    /** Plafond d'une page. Au-delà, c'est un export, pas une consultation. */
    public static final int LIMITE_MAXIMUM = 100;

    private Pagination() {
    }

    /** Ramène la taille de page demandée dans [1, {@value #LIMITE_MAXIMUM}]. */
    public static int limite(Integer demandee) {
        if (demandee == null || demandee <= 0) return LIMITE_PAR_DEFAUT;
        return Math.min(demandee, LIMITE_MAXIMUM);
    }

    /** Un décalage négatif n'a pas de sens : il repart de zéro. */
    public static int decalage(Integer demande) {
        if (demande == null || demande < 0) return 0;
        return demande;
    }
}
