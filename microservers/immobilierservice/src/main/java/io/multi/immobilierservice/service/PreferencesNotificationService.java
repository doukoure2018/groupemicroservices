package io.multi.immobilierservice.service;

import io.multi.immobilierservice.domain.PreferencesNotification;
import io.multi.immobilierservice.dto.PreferencesNotificationUpdateRequest;

public interface PreferencesNotificationService {

    /**
     * Retourne les préférences du user. Si aucune ligne BD n'existe encore,
     * retourne les defaults sans persister — la 1re modification PATCH crée
     * la ligne. Évite des INSERT inutiles pour les users qui n'ouvrent jamais
     * la page de préférences.
     */
    PreferencesNotification getOrDefaults(Long userId);

    /** Upsert atomique. Champs null = pas de modification. */
    PreferencesNotification update(Long userId, PreferencesNotificationUpdateRequest req);
}
