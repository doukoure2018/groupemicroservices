package io.multi.authorizationserver.event;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.util.Map;
import java.util.UUID;

import static java.time.LocalTime.now;
import static org.springframework.kafka.support.KafkaHeaders.TIMESTAMP;
import static org.springframework.messaging.MessageHeaders.ID;

@Builder
@Getter
@Setter
public class Notification implements Serializable {

    private Event payload;
    private Map<String, String> headers;

    public Notification(Event payload) {
        this(payload, Map.of(ID, UUID.randomUUID().toString(), TIMESTAMP, now().toString()));
    }

    public Notification(Event payload, Map<String, String> headers) {
        this.payload = payload;
        this.headers = headers;
    }
}
