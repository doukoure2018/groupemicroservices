package io.multi.userservice.domain;


import io.multi.userservice.event.Event;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.springframework.lang.Nullable;
import org.springframework.util.ObjectUtils;

import java.io.Serializable;
import java.util.Map;

import static io.multi.userservice.utils.UserUtils.randomUUUID;
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
        this(payload, Map.of(ID, randomUUUID.get(), TIMESTAMP, now().toString()));
    }

    public Notification(@NotNull Event payload, @NotNull Map<String, String> headers) {
        this.payload = payload;
        this.headers = headers;
    }

    @Override
    public boolean equals(@Nullable Object other) {
        // Using nullSafeEquals for proper array equals comparisons
        return (this == other || (other instanceof Notification that &&
                ObjectUtils.nullSafeEquals(this.payload, that.payload) && this.headers.equals(that.headers)));
    }

    @Override
    public int hashCode() {
        // Using nullSafeHashCode for proper array hashCode handling
        return ObjectUtils.nullSafeHash(this.payload, this.headers);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder(getClass().getSimpleName());
        sb.append(" [payload=");
        sb.append(this.payload);
        sb.append(", headers=").append(this.headers).append(']');
        return sb.toString();
    }

}