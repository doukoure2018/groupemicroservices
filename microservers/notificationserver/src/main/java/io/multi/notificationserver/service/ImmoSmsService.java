package io.multi.notificationserver.service;

import io.multi.notificationserver.event.immo.ImmoEventType;

import java.util.Map;

public interface ImmoSmsService {

    /**
     * Traite un event immo et envoie un SMS si :
     * <ul>
     *   <li>l'eventType est éligible au SMS (CONTACT_RECU ou VISITE_CONFIRMEE),</li>
     *   <li>{@code data.smsEnabled == true} (préférence user, snapshot au publish),</li>
     *   <li>le numéro de téléphone destinataire est présent dans le payload.</li>
     * </ul>
     * Sinon log debug et return. Aucun lien avec l'email — les deux canaux sont
     * indépendants : si l'un échoue ou est désactivé, l'autre part quand même.
     */
    void handle(ImmoEventType type, Map<String, Object> data);
}
