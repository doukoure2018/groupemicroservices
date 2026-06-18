-- V29 : table device_tokens — tokens FCM/APNs pour les notifications push.
--
-- Contexte : la notification in-app DEMANDE_AVIS (et les autres) n'apparaît que
-- dans l'app ouverte. Pour une vraie push système (bannière même app fermée),
-- le backend doit envoyer via FCM (Firebase Cloud Messaging) aux tokens de
-- device enregistrés par chaque utilisateur.
--
-- Le mobile enregistre son token à chaque démarrage (POST /billetterie/device-tokens).
-- Un token appartient à un seul device ; il peut migrer d'un user à l'autre
-- (compte partagé / reconnexion) → l'upsert met à jour user_id sur conflit token.
-- platform : ANDROID | IOS. last_seen_at sert au nettoyage des tokens morts.
--
-- NB MVP : le token est un concept "app-global" (immo + billetterie) ; placé
-- ici en billetterie pour livrer vite. À migrer vers userservice plus tard.

CREATE TABLE IF NOT EXISTS device_tokens (
    device_token_id BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token           VARCHAR(512) NOT NULL,
    platform        VARCHAR(10) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_seen_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT uq_device_tokens_token UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id);
