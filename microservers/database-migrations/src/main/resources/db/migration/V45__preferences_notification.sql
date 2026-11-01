-- =============================================================================
-- V45 — Préférences de notification du voyageur
-- =============================================================================
-- Deux interrupteurs, comme l'écran de référence : les nouvelles du voyage
-- (réservation, paiement, départ, remplissage, demande d'avis) et les offres
-- commerciales. Ils ne gouvernent que les notifications POUSSÉES : l'in-app
-- reste écrite dans tous les cas, c'est le journal de bord du compte, et les
-- courriels de confirmation restent dus au titre de la commande.
--
-- Aucune ligne n'est créée tant que le voyageur n'a rien changé : l'absence de
-- ligne vaut « tout activé », et le service renvoie ces valeurs par défaut.
-- =============================================================================

CREATE TABLE IF NOT EXISTS preferences_notification (
    user_id             BIGINT      PRIMARY KEY,
    mises_a_jour_trajet BOOLEAN     NOT NULL DEFAULT TRUE,
    promotions          BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_preferences_notification_user FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON DELETE CASCADE
);

COMMENT ON COLUMN preferences_notification.mises_a_jour_trajet IS
  'Pushes liées à un voyage : réservation, paiement, départ, remplissage, demande d''avis';
COMMENT ON COLUMN preferences_notification.promotions IS
  'Pushes commerciales : remises, promotions, nouveautés';
