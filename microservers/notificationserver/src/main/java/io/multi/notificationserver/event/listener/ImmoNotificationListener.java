package io.multi.notificationserver.event.listener;

import io.multi.notificationserver.event.immo.ImmoNotification;
import io.multi.notificationserver.service.ImmoEmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Consumer Kafka dédié au module immobilier. ISOLÉ du NotificationListener
 * billetterie (topic + enum + listener distincts) pour éviter qu'une régression
 * immo casse l'envoi des emails commande/billet en prod.
 *
 * <p>Le topic {@code IMMO_NOTIFICATION_TOPIC} est créé automatiquement par
 * Kafka au premier publish si {@code auto.create.topics.enable=true} (par
 * défaut). Sinon, le créer manuellement.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ImmoNotificationListener {

    private static final String IMMO_NOTIFICATION_TOPIC = "IMMO_NOTIFICATION_TOPIC";

    private final ImmoEmailService immoEmailService;

    @KafkaListener(topics = IMMO_NOTIFICATION_TOPIC, groupId = "immo-notification-consumer")
    public void handle(ImmoNotification notification) {
        if (notification == null || notification.getPayload() == null) {
            log.warn("ImmoNotification null ou payload vide, skip");
            return;
        }
        var event = notification.getPayload();
        log.info("Reçu event immo : type={} dataKeys={}",
                event.getEventType(),
                event.getData() != null ? event.getData().keySet() : "[]");
        immoEmailService.handle(event.getEventType(), event.getData());
    }
}
