package io.multi.billetterieservice.service;

import io.multi.billetterieservice.domain.PreferencesNotification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Ce que le voyageur accepte de recevoir en notification poussée. L'absence de
 * ligne vaut « tout activé » : personne n'a de ligne tant qu'il n'a rien
 * changé, et la valeur par défaut vit ici plutôt que dans un backfill.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PreferencesNotificationService {

    private static final String FIND = """
        SELECT mises_a_jour_trajet, promotions FROM preferences_notification WHERE user_id = :userId
        """;

    private static final String UPSERT = """
        INSERT INTO preferences_notification (user_id, mises_a_jour_trajet, promotions)
        VALUES (:userId, :misesAJourTrajet, :promotions)
        ON CONFLICT (user_id) DO UPDATE
           SET mises_a_jour_trajet = EXCLUDED.mises_a_jour_trajet,
               promotions = EXCLUDED.promotions,
               updated_at = CURRENT_TIMESTAMP
        """;

    private final JdbcClient jdbcClient;

    @Transactional(readOnly = true)
    public PreferencesNotification lire(Long userId) {
        return jdbcClient.sql(FIND)
                .param("userId", userId)
                .query((rs, rowNum) -> PreferencesNotification.builder()
                        .misesAJourTrajet(rs.getBoolean("mises_a_jour_trajet"))
                        .promotions(rs.getBoolean("promotions"))
                        .build())
                .optional()
                .orElseGet(() -> PreferencesNotification.builder().misesAJourTrajet(true).promotions(true).build());
    }

    @Transactional
    public PreferencesNotification enregistrer(Long userId, PreferencesNotification preferences) {
        jdbcClient.sql(UPSERT)
                .param("userId", userId)
                .param("misesAJourTrajet", preferences.isMisesAJourTrajet())
                .param("promotions", preferences.isPromotions())
                .update();
        log.info("Préférences de notification enregistrées pour l'utilisateur {}", userId);
        return preferences;
    }

    /**
     * Une catégorie commerciale relève de l'interrupteur « promotions », tout
     * le reste des nouvelles du voyage. Une catégorie inconnue est traitée
     * comme une nouvelle du voyage : mieux vaut prévenir d'un départ qu'une
     * nouveauté de code fasse taire une information utile.
     */
    public boolean pushAutorisee(Long userId, String categorie) {
        PreferencesNotification p = lire(userId);
        String c = categorie == null ? "" : categorie.toUpperCase();
        // Les événements du logement ne relèvent pas des réglages de voyage : leurs
        // préférences vivent dans le service immobilier (SMS). La push suit l'in-app.
        if (c.startsWith("IMMO_")) return true;
        boolean commerciale = c.startsWith("PROMO") || c.startsWith("REMISE") || c.startsWith("NOUVEAUTE");
        return commerciale ? p.isPromotions() : p.isMisesAJourTrajet();
    }
}
