package io.multi.userservice.event;

import io.multi.userservice.enumeration.EventType;
import lombok.*;

import java.util.Map;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Event {

    private EventType eventType;
    private Map<String, ?> data;
}
