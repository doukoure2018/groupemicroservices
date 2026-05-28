package io.multi.immobilierservice.service;

import io.multi.immobilierservice.event.EventType;

import java.util.Map;

public interface ImmoNotificationProducer {

    /** Topic Kafka dédié au module immobilier (isolé de NOTIFICATION_TOPIC billetterie). */
    String IMMO_NOTIFICATION_TOPIC = "IMMO_NOTIFICATION_TOPIC";

    /**
     * Publie un événement Kafka après marquage idempotent en BDD.
     *
     * <p>Pattern : INSERT immo_notification_emise → si OK, send Kafka async.
     * Si la référence existe déjà, on log et on skip (anti-doublon : rejeu Kafka,
     * retry consumer, double POST par le client).
     *
     * <p>Préférence assumée : perdre un email plutôt qu'en envoyer deux. Choix
     * conscient pour ces 7 events informatifs. Pas une règle globale.
     *
     * @param eventType type d'événement (préfixe IMMO_)
     * @param reference clé d'idempotence "{EVENT_TYPE}:{entityUuid}"
     * @param data payload auto-suffisant (toutes les infos pour le template)
     */
    void publish(EventType eventType, String reference, Map<String, ?> data);
}
