-- =============================================================================
-- Rebrand SYNERGIA : URI de redirection et de déconnexion OAuth2
-- =============================================================================
-- Le domaine passe de sira-guinee.com à synergia-guinee.com. Les deux sont
-- déclarés pendant la transition : l'ancien redirige en 301 vers le nouveau,
-- mais un client déjà ouvert peut encore présenter l'ancienne URI de retour.
-- Retirer les entrées sira-guinee.com à l'expiration du domaine (31 mai 2027).
--
-- Succède à V22 (qui pointait sira-guinee.com) et V9 (guidipress-io.com).
-- Idempotent : ré-application sans casse (UPDATE sur client_id='client').
-- =============================================================================

UPDATE oauth2_registered_client
SET redirect_uris = 'http://localhost:4202,'
                 || 'https://synergia-guinee.com,https://www.synergia-guinee.com,https://test.synergia-guinee.com,'
                 || 'https://sira-guinee.com,https://test.sira-guinee.com',
    post_logout_redirect_uris = 'http://127.0.0.1:8090,'
                 || 'https://synergia-guinee.com,https://test.synergia-guinee.com,'
                 || 'https://sira-guinee.com,https://test.sira-guinee.com'
WHERE client_id = 'client';
