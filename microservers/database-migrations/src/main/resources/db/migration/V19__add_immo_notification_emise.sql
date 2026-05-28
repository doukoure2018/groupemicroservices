-- =============================================================================
-- V19 — Idempotence des notifications immobilier (anti-doublon Kafka)
-- =============================================================================
-- Sans ce garde-fou, un rejeu Kafka (retry, restart broker, redéploiement)
-- entraîne un double envoi d'email. La table immo_notification_emise garde
-- la trace de toute notification déjà publiée, indexée par une référence
-- unique de type "{EVENT_TYPE}:{entityUuid}".
--
-- Pattern producteur (côté immobilierservice) :
--   INSERT INTO immo_notification_emise (reference, event_type) → fail si doublon
--   kafkaTemplate.send(...)
--
-- INSERT avant send : on préfère perdre un email (crash entre INSERT et send)
-- plutôt que d'en envoyer deux. Choix conscient pour ces 7 events (tous
-- informatifs, aucun critique type paiement) — pas une règle globale.
-- =============================================================================

CREATE TABLE IF NOT EXISTS immo_notification_emise (
    id           BIGSERIAL PRIMARY KEY,
    reference    VARCHAR(150) NOT NULL,
    event_type   VARCHAR(60)  NOT NULL,
    emise_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_immo_notification_emise_reference UNIQUE (reference)
);

CREATE INDEX IF NOT EXISTS idx_immo_notification_emise_event_time
    ON immo_notification_emise (event_type, emise_at DESC);
