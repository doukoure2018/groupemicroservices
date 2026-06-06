-- Audit log actions modération admin (MVP minimal : VALIDER + REJETER).
-- Ferme la dette audit-log-moderation-admin.
-- Étendre l'enum action quand de nouvelles actions (SUPPRIMER, EDITER, ...)
-- seront codées côté Java.

CREATE TABLE IF NOT EXISTS immo_admin_action (
    action_id BIGSERIAL PRIMARY KEY,
    action_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    admin_user_id BIGINT NOT NULL,
    propriete_uuid UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    motif TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Enum applicatif reproduit en BD pour refuser les INSERTs erronés
    -- (defense in depth + protection contre les futurs bugs de mapping Java).
    CONSTRAINT chk_action_enum CHECK (action IN ('VALIDER', 'REJETER')),

    -- Règle métier reproduite côté BD : motif NULL pour VALIDER (UX inutile),
    -- motif requis ≥15 chars pour REJETER (cohérent avec validation Java côté
    -- RejeterRequest @Size(min=15)). Refuse les INSERT incohérents.
    CONSTRAINT chk_motif_business_rule CHECK (
        (action = 'VALIDER' AND motif IS NULL) OR
        (action = 'REJETER' AND motif IS NOT NULL AND char_length(motif) >= 15)
    )
);

CREATE INDEX IF NOT EXISTS idx_immo_admin_action_admin
    ON immo_admin_action(admin_user_id);

CREATE INDEX IF NOT EXISTS idx_immo_admin_action_propriete
    ON immo_admin_action(propriete_uuid);

CREATE INDEX IF NOT EXISTS idx_immo_admin_action_created
    ON immo_admin_action(created_at DESC);

COMMENT ON TABLE immo_admin_action IS
    'Audit log actions admin modération. MVP : VALIDER + REJETER seulement. Lecture via SQL direct (pas d''endpoint REST). Cf dette admin-action-no-rest-endpoint.';

COMMENT ON COLUMN immo_admin_action.motif IS
    'NULL obligatoire pour VALIDER (chk_motif_business_rule). Requis ≥15 chars pour REJETER (cohérent avec RejeterRequest.motif @Size côté Java).';
