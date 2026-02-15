-- Update OAuth2 client redirect URIs to include production domain
UPDATE oauth2_registered_client
SET redirect_uris = 'http://localhost:4202,https://guidipress-io.com',
    post_logout_redirect_uris = 'http://127.0.0.1:8090,https://guidipress-io.com'
WHERE client_id = 'client';
