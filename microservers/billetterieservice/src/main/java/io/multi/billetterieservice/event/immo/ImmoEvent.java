package io.multi.billetterieservice.event.immo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

/**
 * Un événement du service immobilier, tel qu'il circule sur
 * {@code IMMO_NOTIFICATION_TOPIC}. Le type est une chaîne et non l'énumération
 * de l'immobilier : ce service n'a pas à connaître toute sa liste, il ne
 * retient que ceux qu'il sait raconter au téléphone.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ImmoEvent {
    private String eventType;
    private Map<String, Object> data;
}
