package io.multi.notificationserver.event.immo;

import lombok.*;

import java.io.Serializable;
import java.util.Map;

/**
 * Enveloppe Kafka pour les events immo. Mirror de {@code io.multi.immobilierservice.event.Notification}.
 *
 * <p>TODO : à extraire dans le module {@code clients/} (cf. note Phase 11).
 */
@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ImmoNotification implements Serializable {
    private ImmoEvent payload;
    private Map<String, String> headers;
}
