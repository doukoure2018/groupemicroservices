package io.multi.notificationserver.service;

import io.multi.notificationserver.event.immo.ImmoEventType;

import java.util.Map;

public interface ImmoEmailService {

    /** Envoie (ou stubbe selon flag dev) un email basé sur un event immo. */
    void handle(ImmoEventType type, Map<String, Object> data);

    /**
     * Rend le template d'un event sans envoyer — utilisé par l'endpoint test-render
     * en profile dev. Retourne le HTML qui aurait été envoyé.
     */
    String renderPreview(ImmoEventType type, Map<String, Object> data);
}
