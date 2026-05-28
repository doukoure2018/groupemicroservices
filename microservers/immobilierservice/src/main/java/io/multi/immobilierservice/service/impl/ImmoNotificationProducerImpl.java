package io.multi.immobilierservice.service.impl;

import io.multi.immobilierservice.event.Event;
import io.multi.immobilierservice.event.EventType;
import io.multi.immobilierservice.event.Notification;
import io.multi.immobilierservice.repository.NotificationEmiseRepository;
import io.multi.immobilierservice.service.ImmoNotificationProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static org.springframework.kafka.support.KafkaHeaders.TOPIC;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImmoNotificationProducerImpl implements ImmoNotificationProducer {

    private final KafkaTemplate<String, Notification> kafkaTemplate;
    private final NotificationEmiseRepository notificationEmiseRepository;

    @Override
    @Transactional
    public void publish(EventType eventType, String reference, Map<String, ?> data) {
        // Anti-doublon en première barrière (race possible avec contrainte UNIQUE en 2e barrière).
        if (notificationEmiseRepository.existsByReference(reference)) {
            log.debug("Notification déjà émise, skip : {}", reference);
            return;
        }
        try {
            notificationEmiseRepository.insert(reference, eventType.name());
        } catch (DuplicateKeyException e) {
            // Race : un autre thread a inséré entre exists() et insert(). Skip silencieusement.
            log.debug("Notification race condition, skip : {}", reference);
            return;
        }

        Event event = Event.builder().eventType(eventType).data(data).build();
        var message = MessageBuilder.withPayload(new Notification(event))
                .setHeader(TOPIC, IMMO_NOTIFICATION_TOPIC)
                .build();

        // Envoi async pour ne pas bloquer la transaction métier. Si Kafka est down,
        // l'INSERT immo_notification_emise a déjà eu lieu → bonbon perdu. C'est le
        // trade-off conscient pour ces events informatifs (vs paiement critique).
        CompletableFuture.runAsync(() -> {
            try {
                kafkaTemplate.send(message);
                log.info("Notification Kafka publiée : {} ({})", eventType, reference);
            } catch (Exception ex) {
                log.error("Kafka indisponible, notification {} perdue : {}", eventType, reference, ex);
            }
        });
    }
}
