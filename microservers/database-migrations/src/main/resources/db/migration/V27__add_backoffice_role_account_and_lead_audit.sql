-- V27 : Intermédiation leads Phase 1 MVP.
-- Rôle ADMIN_BACKOFFICE + compte back-office + colonnes audit-log
-- (lead_statut / note_admin / traite_par / traite_at) sur immo_contact et
-- immo_visite. Le back-office reçoit les demandes contact/visite (le vendeur
-- n'est plus notifié, cf code backend).

-- 1. Rôle ADMIN_BACKOFFICE (idempotent)
INSERT INTO roles (role_uuid, name, authority)
SELECT '71af71eb-05d2-46f3-b96e-638b4314f19b', 'ADMIN_BACKOFFICE',
       'immo:lead:read,immo:lead:update,user:read'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ADMIN_BACKOFFICE');

-- 2. Compte back-office (douklifsa93@gmail.com / +224621091895).
--    PROMOTE si l'email existe déjà (cas TEST : compte réel de la personne →
--    elle garde SON mot de passe), sinon CREATE avec un mot de passe
--    TEMPORAIRE (cas PROD vierge — à changer au 1er login).
DO $$
DECLARE v_user_id BIGINT;
BEGIN
    SELECT user_id INTO v_user_id FROM users WHERE email = 'douklifsa93@gmail.com';

    IF v_user_id IS NULL THEN
        CALL create_user(
            uuid_generate_v4()::varchar, 'Back', 'Office',
            'douklifsa93@gmail.com', 'backoffice',
            '$2y$12$3T.0MCBmYjiFYDI2OrkdgedPcVL.bYGL.Kl7saNt8Nw9SQq39fUXC',
            uuid_generate_v4()::varchar, uuid_generate_v4()::varchar,
            uuid_generate_v4()::varchar
        );
        SELECT user_id INTO v_user_id FROM users WHERE email = 'douklifsa93@gmail.com';
        UPDATE users SET phone = '+224621091895' WHERE user_id = v_user_id;
    END IF;

    UPDATE users SET enabled = TRUE, account_non_expired = TRUE,
        account_non_locked = TRUE
    WHERE user_id = v_user_id;

    UPDATE user_roles SET role_id = (SELECT role_id FROM roles WHERE name = 'ADMIN_BACKOFFICE')
    WHERE user_id = v_user_id;
END $$;

-- 3. Colonnes audit-log "lead back-office" — séparées du `statut` métier
--    existant et de vu_par_vendeur (conservés). lead_statut : NOUVEAU/TRAITE/REJETE.
ALTER TABLE immo_contact
    ADD COLUMN IF NOT EXISTS lead_statut VARCHAR(20) NOT NULL DEFAULT 'NOUVEAU',
    ADD COLUMN IF NOT EXISTS note_admin  TEXT,
    ADD COLUMN IF NOT EXISTS traite_par  BIGINT,
    ADD COLUMN IF NOT EXISTS traite_at   TIMESTAMP WITH TIME ZONE;
ALTER TABLE immo_contact DROP CONSTRAINT IF EXISTS ck_immo_contact_lead_statut;
ALTER TABLE immo_contact
    ADD CONSTRAINT ck_immo_contact_lead_statut
    CHECK (lead_statut IN ('NOUVEAU', 'TRAITE', 'REJETE'));

ALTER TABLE immo_visite
    ADD COLUMN IF NOT EXISTS lead_statut VARCHAR(20) NOT NULL DEFAULT 'NOUVEAU',
    ADD COLUMN IF NOT EXISTS note_admin  TEXT,
    ADD COLUMN IF NOT EXISTS traite_par  BIGINT,
    ADD COLUMN IF NOT EXISTS traite_at   TIMESTAMP WITH TIME ZONE;
ALTER TABLE immo_visite DROP CONSTRAINT IF EXISTS ck_immo_visite_lead_statut;
ALTER TABLE immo_visite
    ADD CONSTRAINT ck_immo_visite_lead_statut
    CHECK (lead_statut IN ('NOUVEAU', 'TRAITE', 'REJETE'));
