package io.multi.billetterieservice.domain;


import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;

import java.util.Map;

/**
 * Record Response pour les réponses API
 * Compatible avec RequestUtils
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class Response {
    private Long time;              // Timestamp en millisecondes
    private Long timeStamp;         // Alias pour time (compatibilité)
    private int code;               // Code HTTP
    private Integer statusCode;     // Alias pour code (compatibilité)
    private String path;            // Chemin de la requête
    private HttpStatus httpStatus;  // Status HTTP
    private HttpStatus status;      // Alias pour httpStatus (compatibilité)
    private String message;         // Message principal
    private String exception;       // Message d'exception
    private String developerMessage; // Alias pour exception (compatibilité)
    private Map<?, ?> data;         // Données de la réponse

    // Constructeur pour RequestUtils (ordre des paramètres important)
    public Response(Long time, int code, String path, HttpStatus httpStatus, String message, String exception, Map<?, ?> data) {
        this.time = time;
        this.timeStamp = time;
        this.code = code;
        this.statusCode = code;
        this.path = path;
        this.httpStatus = httpStatus;
        this.status = httpStatus;
        this.message = message;
        this.exception = exception;
        this.developerMessage = exception;
        this.data = data;
    }

    // Méthodes de factory pour simplifier la création
    public static Response success(String message, Map<?, ?> data, HttpStatus status, String path) {
        return Response.builder()
                .time(System.currentTimeMillis())
                .timeStamp(System.currentTimeMillis())
                .code(status.value())
                .statusCode(status.value())
                .path(path)
                .httpStatus(status)
                .status(status)
                .message(message)
                .data(data)
                .build();
    }

    public static Response error(String message, String exception, HttpStatus status, String path) {
        return Response.builder()
                .time(System.currentTimeMillis())
                .timeStamp(System.currentTimeMillis())
                .code(status.value())
                .statusCode(status.value())
                .path(path)
                .httpStatus(status)
                .status(status)
                .message(message)
                .exception(exception)
                .developerMessage(exception)
                .build();
    }
}