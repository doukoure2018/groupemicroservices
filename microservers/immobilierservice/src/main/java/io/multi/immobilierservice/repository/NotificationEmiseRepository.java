package io.multi.immobilierservice.repository;

public interface NotificationEmiseRepository {

    /** True si une notification de cette référence a déjà été émise (anti-doublon Kafka). */
    boolean existsByReference(String reference);

    /**
     * Marque la notification comme émise. Throw si la référence existe déjà
     * (uq_immo_notification_emise_reference) — sécurité supplémentaire en cas
     * de race entre exists() et insert().
     */
    void insert(String reference, String eventType);
}
