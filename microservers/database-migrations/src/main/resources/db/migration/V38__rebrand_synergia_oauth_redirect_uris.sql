-- =============================================================================
-- Rebrand SYNERGIA : URI de redirection et de déconnexion OAuth2
-- =============================================================================
-- Le domaine passe de sira-guinee.com à synergia-guinee.com. L'ancien domaine
-- est abandonné (serveur disparu, aucune redirection conservée) : seules les
-- URI du nouveau domaine sont déclarées.
--
-- Succède à V22 (sira-guinee.com) et V9 (guidipress-io.com).
-- Idempotent : ré-application sans casse (UPDATE sur client_id='client').
-- =============================================================================

UPDATE oauth2_registered_client
SET redirect_uris = 'http://localhost:4202,'
                 || 'https://synergia-guinee.com,https://www.synergia-guinee.com,https://test.synergia-guinee.com',
    post_logout_redirect_uris = 'http://127.0.0.1:8090,'
                 || 'https://synergia-guinee.com,https://test.synergia-guinee.com'
WHERE client_id = 'client';
