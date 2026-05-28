package io.multi.immobilierservice.dto;

import lombok.Data;

/**
 * PATCH body. Champs en {@link Boolean} (boxed) pour distinguer
 * "non envoyé" (null → on garde la valeur actuelle) de "explicitement false".
 */
@Data
public class PreferencesNotificationUpdateRequest {

    private Boolean contactSms;
    private Boolean visiteConfirmeeSms;
}
