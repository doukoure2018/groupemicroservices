-- ============================================================
-- V33 - Compte back-office conformité (pattern V27 ADMIN_BACKOFFICE)
-- ============================================================
-- Crée le compte de l'équipe conformité avec le rôle ADMIN_CONFORMITE (V31).
-- PROMOTE si l'email existe déjà (il garde son mot de passe), sinon CREATE
-- avec un mot de passe TEMPORAIRE « Conformite#2026 » à changer au 1er login.
-- pgcrypto est « trusted » en PG 13+ : créable par le propriétaire de la base.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE v_user_id BIGINT;
BEGIN
    -- PROMOTE par email OU username (un compte conformité local/manuel peut déjà exister)
    SELECT user_id INTO v_user_id FROM users
    WHERE email = 'conformite@sira-guinee.com' OR username = 'conformite'
    ORDER BY user_id LIMIT 1;

    IF v_user_id IS NULL THEN
        CALL create_account(
            uuid_generate_v4()::varchar,
            'Equipe', 'Conformite',
            'conformite@sira-guinee.com', 'conformite',
            crypt('Conformite#2026', gen_salt('bf', 12)),
            uuid_generate_v4()::varchar,
            uuid_generate_v4()::varchar,
            uuid_generate_v4()::varchar,
            'ADMIN_CONFORMITE'
        );
        SELECT user_id INTO v_user_id FROM users WHERE email = 'conformite@sira-guinee.com';
    END IF;

    UPDATE users SET enabled = TRUE, account_non_expired = TRUE, account_non_locked = TRUE
    WHERE user_id = v_user_id;

    UPDATE user_roles SET role_id = (SELECT role_id FROM roles WHERE name = 'ADMIN_CONFORMITE')
    WHERE user_id = v_user_id;
END $$;
