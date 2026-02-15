-- =============================================
-- Create Eureka manager user for service discovery authentication
-- Username: manager / Password: manager2711 (BCrypt encoded)
-- Role: SUPER_ADMIN (has app:read authority required by Eureka)
-- =============================================

CALL create_account(
    'eureka-mgr-550e-8400-e29b-41d4a716',
    'Eureka',
    'Manager',
    'eureka-manager@guidipress-io.com',
    'manager',
    '$2a$12$Tllgchboe57VBeNVgd7wxOePBgn0PHFAbIGcji/oMVcJR3knKlqzu',
    'eureka-cred-7c9e-6679-7425-40de',
    'eureka-token-550e-8400-e29b-41d4',
    'eureka-member-001',
    'SUPER_ADMIN'
);

-- Enable the manager account
UPDATE users
SET enabled = TRUE,
    account_non_expired = TRUE,
    account_non_locked = TRUE
WHERE username = 'manager';
