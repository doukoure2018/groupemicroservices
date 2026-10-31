package io.multi.userservice.handler;

import io.multi.userservice.domain.Response;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.errors.ApiException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import static io.multi.userservice.utils.RequestUtils.handleErrorResponse;

/**
 * Jusqu'ici le service n'avait aucun gestionnaire : tout refus métier
 * remontait en erreur interne muette, et tant que la page d'erreur était
 * protégée, en 401 « You are not logged in ». Ni le client ni l'exploitant
 * ne voyaient jamais la cause. Les autres services répondent avec la même
 * enveloppe que leurs succès ; celui-ci fait désormais pareil.
 *
 * <p>L'exception métier historique du service est, par accident de
 * complétion automatique, celle de la bibliothèque Kafka. La renommer
 * toucherait des dizaines de fichiers : on la traite telle quelle.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /** Refus métier : identifiants, lien invalide, compte inconnu. Le message est destiné au client. */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Response> metier(ApiException e, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(handleErrorResponse(e.getMessage(), e.getClass().getSimpleName(), request, HttpStatus.BAD_REQUEST));
    }

    /** Lecture d'une ligne absente qui n'a pas été interceptée plus bas. */
    @ExceptionHandler(EmptyResultDataAccessException.class)
    public ResponseEntity<Response> absent(EmptyResultDataAccessException e, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(handleErrorResponse("Ressource introuvable", e.getClass().getSimpleName(), request, HttpStatus.NOT_FOUND));
    }

    /**
     * Tout le reste. Le message est renvoyé parce que ce service ne manipule
     * pas de secret dans ses messages d'erreur et que, sans lui, un incident
     * sur l'environnement de test est indiagnosticable de l'extérieur.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Response> interne(Exception e, HttpServletRequest request) {
        log.error("Erreur non gérée sur {} : {}", request.getRequestURI(), e.toString());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(handleErrorResponse(
                        "Une erreur interne est survenue. Réessayez ou contactez le support.",
                        e.getClass().getSimpleName() + ": " + e.getMessage(), request, HttpStatus.INTERNAL_SERVER_ERROR));
    }
}
