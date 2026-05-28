package io.multi.immobilierservice.repository;

import io.multi.immobilierservice.domain.PreferencesNotification;

import java.util.Optional;

public interface PreferencesNotificationRepository {

    Optional<PreferencesNotification> findByUserId(Long userId);

    /**
     * Upsert : crée la ligne avec les defaults manquants, ou met à jour les
     * champs non-null fournis. Renvoie l'état final de la ligne.
     */
    PreferencesNotification upsert(Long userId, Boolean contactSms, Boolean visiteConfirmeeSms);
}
