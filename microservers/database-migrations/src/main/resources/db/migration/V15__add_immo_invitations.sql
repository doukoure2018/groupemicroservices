-- =============================================================================
-- V15 : Consentement agent — table d'invitations
-- =============================================================================
-- Corrige le trou de sécurité de la Phase 4 :
-- avant V15, POST /immo/agences/{uuid}/agents créait directement un profil
-- AGENT_AGENCE pour un user arbitraire SANS son consentement.
--
-- Désormais l'agence émet une INVITATION ; le user cible doit l'accepter
-- (ou la refuser) explicitement pour devenir agent.
-- =============================================================================

CREATE TABLE IF NOT EXISTS immo_agence_invitation (
    invitation_id BIGSERIAL PRIMARY KEY,
    invitation_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    token VARCHAR(64) NOT NULL,                             -- URL-safe, unique
    agence_id BIGINT NOT NULL,
    invite_user_id BIGINT NOT NULL,                         -- destinataire de l'invitation
    invite_par_user_id BIGINT NOT NULL,                     -- patron agence émetteur
    bio_proposee TEXT,                                      -- pré-rempli côté patron pour le profil
    telephone_propose VARCHAR(20),
    statut VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
    motif_refus TEXT,
    date_expiration TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    date_reponse TIMESTAMP(6) WITH TIME ZONE,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_immo_invitation_uuid UNIQUE (invitation_uuid),
    CONSTRAINT uq_immo_invitation_token UNIQUE (token),
    CONSTRAINT ck_immo_invitation_statut CHECK (
        statut IN ('EN_ATTENTE', 'ACCEPTEE', 'REFUSEE', 'EXPIREE', 'REVOQUEE')
    ),
    CONSTRAINT fk_immo_invitation_agence FOREIGN KEY (agence_id)
        REFERENCES immo_agence (agence_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_immo_invitation_user FOREIGN KEY (invite_user_id)
        REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_immo_invitation_par FOREIGN KEY (invite_par_user_id)
        REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Empêcher 2 invitations EN_ATTENTE simultanées pour le même couple (agence, user)
CREATE UNIQUE INDEX IF NOT EXISTS uq_immo_invitation_active
    ON immo_agence_invitation (agence_id, invite_user_id)
    WHERE statut = 'EN_ATTENTE';

CREATE INDEX IF NOT EXISTS idx_immo_invitation_user
    ON immo_agence_invitation (invite_user_id);
CREATE INDEX IF NOT EXISTS idx_immo_invitation_agence
    ON immo_agence_invitation (agence_id);
CREATE INDEX IF NOT EXISTS idx_immo_invitation_expiration
    ON immo_agence_invitation (date_expiration)
    WHERE statut = 'EN_ATTENTE';

CREATE TRIGGER trg_immo_agence_invitation_updated_at
    BEFORE UPDATE ON immo_agence_invitation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
