package io.multi.immobilierservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PreferencesNotification {

    private Long userId;
    private boolean contactSms;
    private boolean visiteConfirmeeSms;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    /** Defaults sensés appliqués quand aucune ligne BD n'existe pour ce user. */
    public static PreferencesNotification defaultsFor(Long userId) {
        return PreferencesNotification.builder()
                .userId(userId)
                .contactSms(true)
                .visiteConfirmeeSms(true)
                .build();
    }
}
