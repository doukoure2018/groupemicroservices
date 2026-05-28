package io.multi.notificationserver.event.immo;

import lombok.*;

import java.util.Map;

/**
 * Payload Kafka pour les events immobilier. Mirror de {@code io.multi.immobilierservice.event.Event}.
 *
 * <p>TODO : à extraire dans le module {@code clients/} (cf. note Phase 11).
 */
@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ImmoEvent {
    private ImmoEventType eventType;
    private Map<String, Object> data;
}
