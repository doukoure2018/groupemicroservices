package io.multi.immobilierservice.repository.impl;

import io.multi.immobilierservice.domain.PreferencesNotification;
import io.multi.immobilierservice.mapper.PreferencesNotificationRowMapper;
import io.multi.immobilierservice.repository.PreferencesNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class PreferencesNotificationRepositoryImpl implements PreferencesNotificationRepository {

    private final JdbcClient jdbcClient;
    private final PreferencesNotificationRowMapper rowMapper;

    @Override
    public Optional<PreferencesNotification> findByUserId(Long userId) {
        return jdbcClient.sql("""
                SELECT user_id, contact_sms, visite_confirmee_sms, created_at, updated_at
                FROM immo_preferences_notification
                WHERE user_id = :userId
                """)
                .param("userId", userId)
                .query(rowMapper)
                .optional();
    }

    /**
     * UPSERT atomique. Si la ligne n'existe pas, on l'insère avec les valeurs
     * fournies OU les defaults (true) pour les champs null. Si la ligne existe,
     * COALESCE évalue à la valeur fournie ou à la valeur existante si null.
     */
    @Override
    public PreferencesNotification upsert(Long userId, Boolean contactSms, Boolean visiteConfirmeeSms) {
        return jdbcClient.sql("""
                INSERT INTO immo_preferences_notification
                    (user_id, contact_sms, visite_confirmee_sms)
                VALUES
                    (:userId,
                     COALESCE(:contactSms, TRUE),
                     COALESCE(:visiteConfirmeeSms, TRUE))
                ON CONFLICT (user_id) DO UPDATE SET
                    contact_sms          = COALESCE(:contactSms,          immo_preferences_notification.contact_sms),
                    visite_confirmee_sms = COALESCE(:visiteConfirmeeSms, immo_preferences_notification.visite_confirmee_sms),
                    updated_at           = CURRENT_TIMESTAMP
                RETURNING user_id, contact_sms, visite_confirmee_sms, created_at, updated_at
                """)
                .param("userId", userId)
                .param("contactSms", contactSms)
                .param("visiteConfirmeeSms", visiteConfirmeeSms)
                .query(rowMapper)
                .single();
    }
}
