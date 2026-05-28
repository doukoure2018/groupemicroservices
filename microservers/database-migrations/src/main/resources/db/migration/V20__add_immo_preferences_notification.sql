-- =============================================================================
-- V20 — Préférences de notification par user pour le module immo
-- =============================================================================
-- Table minimale : 2 booléens par canal coûteux (SMS). Les emails (gratuits)
-- restent toujours activés et ne sont PAS représentés ici.
--
-- Defaults sensés : les 2 canaux SMS activés. Le user désactive en opt-out
-- via PATCH /immo/preferences. Pas de backfill : si aucune ligne pour un user,
-- le service Java retourne les defaults — aucune ligne créée tant qu'il n'y a
-- pas eu d'opt-out explicite. Économise les writes.
--
-- Naming : "visite_confirmee_sms" (pas "visite_sms") car en 12b seul l'event
-- VISITE_CONFIRMEE part en SMS, pas VISITE_DEMANDEE. Si VISITE_DEMANDEE part
-- en SMS plus tard, ajouter "visite_demandee_sms" en ALTER TABLE.
--
-- Extension WhatsApp future : ALTER TABLE ADD COLUMN contact_whatsapp/
-- visite_confirmee_whatsapp BOOLEAN DEFAULT FALSE. Zéro refonte.
-- =============================================================================

CREATE TABLE IF NOT EXISTS immo_preferences_notification (
    user_id                BIGINT      PRIMARY KEY,
    contact_sms            BOOLEAN     NOT NULL DEFAULT TRUE,
    visite_confirmee_sms   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_immo_pref_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE
);

COMMENT ON COLUMN immo_preferences_notification.contact_sms IS
  'SMS lors d''un nouveau contact reçu par le vendeur (IMMO_CONTACT_RECU)';
COMMENT ON COLUMN immo_preferences_notification.visite_confirmee_sms IS
  'SMS au visiteur quand le vendeur confirme sa demande (IMMO_VISITE_CONFIRMEE) — '
  'PAS la demande initiale VISITE_DEMANDEE qui reste email-only';
