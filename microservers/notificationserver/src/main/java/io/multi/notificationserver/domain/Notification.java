package io.multi.notificationserver.domain;

import io.multi.notificationserver.event.Event;
import lombok.*;
import org.springframework.lang.Nullable;
import org.springframework.util.ObjectUtils;

import java.io.Serializable;
import java.util.Map;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Notification implements Serializable {

    private Event payload;

    private Map<String, String> headers;

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

