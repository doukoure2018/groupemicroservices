package io.multi.billetterieservice.event.immo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.Map;

/** Enveloppe Kafka des événements immobiliers ; miroir de {@code io.multi.immobilierservice.event.Notification}. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ImmoNotification implements Serializable {
    private ImmoEvent payload;
    private Map<String, String> headers;
}
