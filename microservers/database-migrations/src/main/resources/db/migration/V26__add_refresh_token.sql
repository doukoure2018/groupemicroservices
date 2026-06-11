-- V26 : table refresh_token — rotation + révocation des refresh tokens mobiles.
--
-- Contexte : les refresh tokens (MobileTokenService, 90 jours) étaient des JWT
-- STATELESS → aucune révocation possible (token volé valide 90j, password
-- change ne tuait pas les sessions). Cette table donne un état serveur :
--   - rotation : à chaque /refresh, l'ancien jti est révoqué, un nouveau inséré
--   - logout / logout-all : révocation ciblée ou de tous les tokens d'un user
--   - password-change (userservice, BD partagée) : révoque tous les tokens
--   - delete user (admin) : FK ON DELETE CASCADE → tokens supprimés auto
--
-- jti = claim JWT ID (UUID.randomUUID().toString()) déjà présent dans le token.
-- VARCHAR(36) (pas type UUID) pour un binding String simple côté JdbcClient.
-- device_info : volontairement absent en MVP (dette
-- refresh-token-device-info-tracking). Reuse-detection famille : hors MVP
-- (dette refresh-token-reuse-detection-revoke-family) — rotation simple ici.

CREATE TABLE IF NOT EXISTS refresh_token (
    jti          VARCHAR(36) PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    revoked      BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_refresh_token_user ON refresh_token(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_token_expires ON refresh_token(expires_at);
