-- =============================================================================
-- Rebrand SIRA Guinée : OAuth2 redirect URIs
-- =============================================================================
-- Override de V9 qui pointait vers guidipress-io.com. Ajoute aussi le sous-
-- domaine test.sira-guinee.com pour l'environnement de test CI/CD.
-- Idempotent : ré-application sans casse (UPDATE sur client_id='client').
-- =============================================================================

UPDATE oauth2_registered_client
SET redirect_uris            = 'http://localhost:4202,https://sira-guinee.com,https://test.sira-guinee.com',
    post_logout_redirect_uris = 'http://127.0.0.1:8090,https://sira-guinee.com,https://test.sira-guinee.com'
WHERE client_id = 'client';
