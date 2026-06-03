-- =============================================================================
-- Désactivation de la consent page OAuth2 pour le client `client`
-- =============================================================================
-- La page de consentement Spring Authorization Server plante en 500
-- (probablement template Thymeleaf manquant) après login successful. Pour MVP
-- single-tenant SIRA Guinée, le consent n'apporte rien (l'utilisateur est
-- forcément OK avec sa propre app), on désactive.
--
-- Idempotent : REPLACE ne fait rien si la chaîne n'existe pas.
-- =============================================================================

UPDATE oauth2_registered_client
SET client_settings = REPLACE(
        client_settings,
        '"settings.client.require-authorization-consent":true',
        '"settings.client.require-authorization-consent":false'
    )
WHERE client_id = 'client';
