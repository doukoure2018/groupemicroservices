package io.multi.immobilierservice.query;

public final class TypeBienQuery {

    private TypeBienQuery() {}

    public static final String FIND_ALL = """
            SELECT * FROM immo_type_bien WHERE actif = TRUE
            ORDER BY ordre_affichage, libelle
            """;

    public static final String FIND_BY_CODE = """
            SELECT * FROM immo_type_bien WHERE code = :code
            """;
}
