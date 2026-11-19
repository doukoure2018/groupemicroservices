package io.multi.billetterieservice.utils;

/**
 * Bornes de pagination. Mêmes raisons que dans le service immobilier : une
 * taille de page libre laisse un appelant demander toute la table, et le produit
 * {@code page * size} non borné déborde l'entier et produit un décalage négatif.
 */
public final class Pagination {

    public static final int LIMITE_PAR_DEFAUT = 20;
    public static final int LIMITE_MAXIMUM = 100;

    private Pagination() {
    }

    /** Ramène la taille de page dans [1, {@value #LIMITE_MAXIMUM}]. */
    public static int limite(Integer demandee) {
        if (demandee == null || demandee <= 0) return LIMITE_PAR_DEFAUT;
        return Math.min(demandee, LIMITE_MAXIMUM);
    }

    /** Numéro de page ramené à un entier positif raisonnable. */
    public static int page(Integer demandee) {
        if (demandee == null || demandee < 0) return 0;
        return Math.min(demandee, 10_000);
    }

    /**
     * Limite d'une recherche d'adresse. Plus basse que les autres : la valeur
     * part telle quelle chez Nominatim, un service tiers gratuit qui bannit
     * l'adresse appelante en cas d'abus.
     */
    public static int limiteCarte(Integer demandee) {
        if (demandee == null || demandee <= 0) return 10;
        return Math.min(demandee, 20);
    }

    /** Décalage calculé en long puis ramené à l'entier : jamais de débordement. */
    public static int decalage(Integer pageDemandee, Integer tailleDemandee) {
        long d = (long) page(pageDemandee) * limite(tailleDemandee);
        return (int) Math.min(d, Integer.MAX_VALUE);
    }
}
