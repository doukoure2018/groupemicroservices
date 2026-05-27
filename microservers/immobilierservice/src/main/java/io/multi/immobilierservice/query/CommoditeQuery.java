package io.multi.immobilierservice.query;

public final class CommoditeQuery {

    private CommoditeQuery() {}

    public static final String FIND_ALL = """
            SELECT * FROM immo_commodite WHERE actif = TRUE
            ORDER BY ordre_affichage, libelle
            """;

    public static final String FIND_BY_CODE = """
            SELECT * FROM immo_commodite WHERE code = :code
            """;

    public static final String FIND_BY_CODES = """
            SELECT * FROM immo_commodite WHERE code = ANY(:codes)
            """;
}
