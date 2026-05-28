package io.multi.immobilierservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

/**
 * Payload d'un événement Kafka : type discriminant + données auto-suffisantes.
 *
 * <p>Le consumer (notificationserver) NE FAIT PAS de re-fetch via Feign — toutes
 * les données nécessaires au rendu Thymeleaf doivent être incluses ici (snapshot
 * au moment de l'événement). Cohérent avec le pattern billetterie et avec la
 * décision snapshot Phase 10a (contacts).
 *
 * <p>TODO : dupliqué de billetterieservice/event/Event.java. À extraire dans
 * le module {@code clients/} (cf. note sur EventType).
 */
@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Event {
    private EventType eventType;
    private Map<String, ?> data;
}
