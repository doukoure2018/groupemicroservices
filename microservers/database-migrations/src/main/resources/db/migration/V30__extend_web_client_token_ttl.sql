-- ============================================================
-- V30 - Allonger la durée de session du client web (backoffice)
-- ============================================================
-- Le client OAuth2 "client" (SPA Angular) était limité à un access token
-- de 5 minutes (300 s) et un refresh token de 1 h (V8). Le frontend ne
-- rafraîchissant pas le token, la session utilisateur expirait au bout
-- de 5 minutes.
--   - access-token-time-to-live  : 300 s  -> 28800 s (8 h)
--   - refresh-token-time-to-live : 3600 s -> 86400 s (24 h)
-- Les REPLACE sont idempotents : si la valeur a déjà été migrée,
-- la chaîne source n'existe plus et l'UPDATE ne change rien.
-- Le client mobile (mobile-app-client) n'est pas concerné.
-- ============================================================

UPDATE oauth2_registered_client
SET token_settings = REPLACE(
        token_settings,
        '"settings.token.access-token-time-to-live":["java.time.Duration",300.000000000]',
        '"settings.token.access-token-time-to-live":["java.time.Duration",28800.000000000]'
    )
WHERE client_id = 'client';

UPDATE oauth2_registered_client
SET token_settings = REPLACE(
        token_settings,
        '"settings.token.refresh-token-time-to-live":["java.time.Duration",3600.000000000]',
        '"settings.token.refresh-token-time-to-live":["java.time.Duration",86400.000000000]'
    )
WHERE client_id = 'client';
