-- =============================================
-- 1. Insert roles (must be first, create_user depends on 'USER' role)
-- =============================================
INSERT INTO roles (role_uuid, name, authority) VALUES
    ('7d1b82b1-92c7-4fae-b790-73eb1ac9d6b5', 'USER', 'user:read,user:update,ticket:create,ticket:read,ticket:update,comment:create,comment:read,comment:update,comment:delete,task:read'),
    ('1a0e13de-4fdf-4db0-8a3d-08fce64cbe8c', 'TECH_SUPPORT', 'user:read,user:update,ticket:create,ticket:read,ticket:update,comment:create,comment:read,comment:update,comment:delete,task:create,task:read,task:update,task:delete'),
    ('894853e1-9238-4c64-b5d8-c0a29bdf1b94', 'MANAGER', 'user:create,user:read,user:update,ticket:create,ticket:read,ticket:update,ticket:delete,comment:create,comment:read,comment:update,comment:delete,task:create,task:read,task:update,task:delete'),
    ('7f907494-90b0-4165-b2fd-00e04fb18b49', 'ADMIN', 'user:create,user:read,user:update,user:delete,ticket:create,ticket:read,ticket:update,ticket:delete,comment:create,comment:read,comment:update,comment:delete,task:create,task:read,task:update,task:delete'),
    ('838ca5ee-eb15-427a-b380-6cf7bfbd68b7', 'SUPER_ADMIN', 'app:create,app:read,app:update,app:delete,user:create,user:read,user:update,user:delete,ticket:create,ticket:read,ticket:update,ticket:delete,comment:create,comment:read,comment:update,comment:delete,task:create,task:read,task:update,task:delete');

-- =============================================
-- 2. Create admin user via stored procedure
-- =============================================
CALL create_user(
    '550e8400-e29b-41d4-a716-446655440000',
    'Innov',
    'innov',
    'innovatechsolutions119@gmail.com',
    'admin',
    '$2a$12$.Ij3d6B03dff0mRTiygaKe26oFXoKOeniewxdRgecM1PnNH1Dz2Jq',
    '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    '550e8400-e29b-41d4-a716-446655440000',
    '778-8909-8655'
);

-- Enable the admin account
UPDATE users SET enabled = TRUE, account_non_expired = TRUE, account_non_locked = TRUE WHERE username = 'admin';

-- Promote admin to SUPER_ADMIN role
UPDATE user_roles SET role_id = (SELECT role_id FROM roles WHERE name = 'SUPER_ADMIN')
WHERE user_id = (SELECT user_id FROM users WHERE username = 'admin');

-- =============================================
-- 3. Insert OAuth2 registered client
-- =============================================
INSERT INTO oauth2_registered_client (
    id, client_id, client_id_issued_at, client_secret, client_secret_expires_at,
    client_name, client_authentication_methods, authorization_grant_types,
    redirect_uris, post_logout_redirect_uris, scopes, client_settings, token_settings
) VALUES (
    '4f339cbd-2c64-4166-8cf6-b5363b1fe0b4',
    'client',
    '2025-06-14 21:43:22.524538+00',
    'secret',
    NULL,
    '4f339cbd-2c64-4166-8cf6-b5363b1fe0b4',
    'none',
    'refresh_token,authorization_code',
    'http://localhost:4202',
    'http://127.0.0.1:8090',
    'openid,profile,email',
    '{"@class":"java.util.Collections$UnmodifiableMap","settings.client.require-proof-key":false,"settings.client.require-authorization-consent":true}',
    '{"@class":"java.util.Collections$UnmodifiableMap","settings.token.reuse-refresh-tokens":true,"settings.token.x509-certificate-bound-access-tokens":false,"settings.token.id-token-signature-algorithm":["org.springframework.security.oauth2.jose.jws.SignatureAlgorithm","RS256"],"settings.token.access-token-time-to-live":["java.time.Duration",300.000000000],"settings.token.access-token-format":{"@class":"org.springframework.security.oauth2.server.authorization.settings.OAuth2TokenFormat","value":"self-contained"},"settings.token.refresh-token-time-to-live":["java.time.Duration",3600.000000000],"settings.token.authorization-code-time-to-live":["java.time.Duration",300.000000000],"settings.token.device-code-time-to-live":["java.time.Duration",300.000000000]}'
);
