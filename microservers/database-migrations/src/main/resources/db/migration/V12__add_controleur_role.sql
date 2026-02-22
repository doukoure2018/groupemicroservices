-- =============================================
-- Add CONTROLEUR role for billet validation
-- =============================================
INSERT INTO roles (role_uuid, name, authority)
VALUES ('a1b2c3d4-5678-9abc-def0-123456789abc', 'CONTROLEUR',
        'user:read,user:update,billet:validate,ticket:read,ticket:create,comment:read');
