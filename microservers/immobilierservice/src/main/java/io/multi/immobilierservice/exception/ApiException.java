package io.multi.immobilierservice.exception;

public class ApiException extends RuntimeException {

    /** Code d'erreur structuré optionnel (ex "NO_IMMO_PROFILE") que le mobile
     * peut matcher de façon fiable, au lieu de parser le message FR. Null =
     * erreur métier générique. */
    private final String code;

    public ApiException(String message) {
        this(message, null);
    }

    public ApiException(String message, String code) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
