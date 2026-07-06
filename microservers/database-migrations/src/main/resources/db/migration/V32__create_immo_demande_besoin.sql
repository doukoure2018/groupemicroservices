-- ============================================================
-- V32 - Déclaration de besoin client (projet 2, 2026-07-06)
-- ============================================================
-- Un utilisateur mobile déclare son besoin (type de bien, zone, budget,
-- commodités, texte libre). La demande est diffusée par email aux agences
-- VERIFIEES de la zone (commune, fallback région, fallback toutes) et
-- visible dans le backoffice des agences (« Demandes clients »).
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS seq_immo_demande_ref;

CREATE TABLE IF NOT EXISTS immo_demande_besoin (
    demande_id BIGSERIAL PRIMARY KEY,
    demande_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    reference VARCHAR(30) NOT NULL DEFAULT ('DEM-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' ||
                                            lpad(nextval('seq_immo_demande_ref')::text, 4, '0')),
    user_id BIGINT NOT NULL,                              -- client déclarant
    type_annonce VARCHAR(15) NOT NULL,                    -- LOCATION | ACHAT
    type_bien_id BIGINT,                                  -- FK immo_type_bien (chambre, appartement, terrain…)
    commune_id BIGINT NOT NULL,                           -- zone du besoin (ex. Ratoma)
    quartier_id BIGINT,                                   -- optionnel (ex. Nongo)
    budget_min NUMERIC(15,0),
    budget_max NUMERIC(15,0),
    devise VARCHAR(3) NOT NULL DEFAULT 'GNF',
    nb_chambres_min INT,
    commodite_ids JSONB,                                  -- ex. [1,4] (cour fermée…)
    description TEXT,                                     -- autres spécificités en texte libre
    contact_telephone VARCHAR(20),
    contact_whatsapp VARCHAR(20),
    statut VARCHAR(15) NOT NULL DEFAULT 'ACTIVE',         -- ACTIVE | POURVUE | ANNULEE | EXPIREE
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_immo_demande_uuid UNIQUE (demande_uuid),
    CONSTRAINT ck_immo_demande_type_annonce CHECK (type_annonce IN ('LOCATION', 'ACHAT')),
    CONSTRAINT ck_immo_demande_statut CHECK (statut IN ('ACTIVE', 'POURVUE', 'ANNULEE', 'EXPIREE')),
    CONSTRAINT ck_immo_demande_budget CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_min <= budget_max),
    CONSTRAINT fk_immo_demande_user FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_immo_demande_type_bien FOREIGN KEY (type_bien_id)
        REFERENCES immo_type_bien (type_bien_id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_immo_demande_commune FOREIGN KEY (commune_id)
        REFERENCES communes (commune_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_immo_demande_quartier FOREIGN KEY (quartier_id)
        REFERENCES quartiers (quartier_id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_immo_demande_statut ON immo_demande_besoin (statut);
CREATE INDEX IF NOT EXISTS idx_immo_demande_commune ON immo_demande_besoin (commune_id) WHERE statut = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_immo_demande_user ON immo_demande_besoin (user_id);
CREATE INDEX IF NOT EXISTS idx_immo_demande_created ON immo_demande_besoin (created_at DESC);

-- Trigger updated_at (fonction partagée créée en V2)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_immo_demande_updated_at') THEN
        CREATE TRIGGER trg_immo_demande_updated_at
            BEFORE UPDATE ON immo_demande_besoin
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
