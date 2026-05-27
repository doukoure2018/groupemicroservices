-- =============================================================================
-- V13 : Module IMMOBILIER
-- =============================================================================
-- Tables pour la gestion des biens immobiliers (location/vente)
-- Profils vendeurs : propriétaire simple, démarcheur, agent d'agence
-- Recherche géospatiale via PostGIS (extension chargée par l'image postgis/postgis)
-- =============================================================================

-- Extension PostGIS (idempotent - déjà chargée par /docker-entrypoint-initdb.d/10_postgis.sh)
CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================================================
-- 1. AGENCES IMMOBILIÈRES
-- =====================================================
CREATE TABLE IF NOT EXISTS immo_agence (
    agence_id BIGSERIAL PRIMARY KEY,
    agence_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    nom VARCHAR(150) NOT NULL,
    raison_sociale VARCHAR(200),
    numero_registre VARCHAR(50),                            -- RCCM
    logo_url VARCHAR(500),
    telephone VARCHAR(20),
    email VARCHAR(150),
    localisation_id BIGINT,                                 -- FK vers localisations existante (V2)
    description TEXT,
    site_web VARCHAR(255),
    reseaux_sociaux JSONB,                                  -- {"facebook": "...", "instagram": "..."}
    proprietaire_user_id BIGINT NOT NULL,                   -- user qui possède l'agence
    statut_verification VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
    documents_kyc_url VARCHAR(500),
    date_creation_agence DATE,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_immo_agence_uuid UNIQUE (agence_uuid),
    CONSTRAINT ck_immo_agence_statut CHECK (statut_verification IN ('EN_ATTENTE', 'VERIFIE', 'REJETE')),
    CONSTRAINT fk_immo_agence_localisation FOREIGN KEY (localisation_id)
        REFERENCES localisations (localisation_id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_immo_agence_proprietaire FOREIGN KEY (proprietaire_user_id)
        REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_immo_agence_proprietaire ON immo_agence (proprietaire_user_id);
CREATE INDEX IF NOT EXISTS idx_immo_agence_statut ON immo_agence (statut_verification);

-- =====================================================
-- 2. PROFILS IMMOBILIERS (lien user → type de vendeur)
-- =====================================================
CREATE TABLE IF NOT EXISTS immo_profil (
    profil_id BIGSERIAL PRIMARY KEY,
    profil_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    user_id BIGINT NOT NULL,
    type_profil VARCHAR(30) NOT NULL,                       -- PROPRIETAIRE_SIMPLE | DEMARCHEUR | AGENT_AGENCE
    agence_id BIGINT,                                       -- requis si type_profil = AGENT_AGENCE
    statut_verification VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
    documents_kyc_url VARCHAR(500),
    bio TEXT,
    telephone_contact VARCHAR(20),
    note_moyenne DECIMAL(3, 2) DEFAULT 0,
    nombre_avis INT DEFAULT 0,
    nombre_proprietes_actives INT DEFAULT 0,                -- compteur cached pour limites
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_immo_profil_uuid UNIQUE (profil_uuid),
    CONSTRAINT uq_immo_profil_user UNIQUE (user_id),        -- 1 profil immo par user
    CONSTRAINT ck_immo_profil_type CHECK (type_profil IN ('PROPRIETAIRE_SIMPLE', 'DEMARCHEUR', 'AGENT_AGENCE')),
    CONSTRAINT ck_immo_profil_statut CHECK (statut_verification IN ('EN_ATTENTE', 'VERIFIE', 'REJETE')),
    CONSTRAINT ck_immo_profil_agence CHECK (
        (type_profil = 'AGENT_AGENCE' AND agence_id IS NOT NULL)
        OR (type_profil <> 'AGENT_AGENCE' AND agence_id IS NULL)
    ),
    CONSTRAINT fk_immo_profil_user FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_immo_profil_agence FOREIGN KEY (agence_id)
        REFERENCES immo_agence (agence_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_immo_profil_user ON immo_profil (user_id);
CREATE INDEX IF NOT EXISTS idx_immo_profil_agence ON immo_profil (agence_id);
CREATE INDEX IF NOT EXISTS idx_immo_profil_type ON immo_profil (type_profil);

-- =====================================================
-- 3. RÉFÉRENTIELS (types de biens, commodités)
-- =====================================================
CREATE TABLE IF NOT EXISTS immo_type_bien (
    type_bien_id BIGSERIAL PRIMARY KEY,
    type_bien_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    code VARCHAR(30) NOT NULL,                              -- MAISON, APPARTEMENT, IMMEUBLE, TERRAIN, BUREAU, BOUTIQUE, CHAMBRE
    libelle VARCHAR(50) NOT NULL,
    description TEXT,
    icone VARCHAR(50),
    ordre_affichage INT DEFAULT 0,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_immo_type_bien_uuid UNIQUE (type_bien_uuid),
    CONSTRAINT uq_immo_type_bien_code UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS immo_commodite (
    commodite_id BIGSERIAL PRIMARY KEY,
    commodite_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    code VARCHAR(30) NOT NULL,
    libelle VARCHAR(50) NOT NULL,
    categorie VARCHAR(30),                                  -- CONFORT | SECURITE | EXTERIEUR
    icone VARCHAR(50),
    ordre_affichage INT DEFAULT 0,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_immo_commodite_uuid UNIQUE (commodite_uuid),
    CONSTRAINT uq_immo_commodite_code UNIQUE (code)
);

-- =====================================================
-- 4. PROPRIÉTÉS (entité centrale)
-- =====================================================
CREATE TABLE IF NOT EXISTS immo_propriete (
    propriete_id BIGSERIAL PRIMARY KEY,
    propriete_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    reference VARCHAR(30) NOT NULL,                         -- BIEN-YYYYMMDD-XXXX (auto-généré par trigger)
    profil_id BIGINT NOT NULL,                              -- vendeur
    agence_id BIGINT,                                       -- redondance pour requêtes rapides (si agent)
    type_annonce VARCHAR(20) NOT NULL,                      -- LOCATION | VENTE
    duree_location VARCHAR(20),                             -- COURT_SEJOUR | LONG_SEJOUR (null si VENTE)
    type_bien_id BIGINT NOT NULL,
    titre VARCHAR(200),
    description TEXT,                                       -- max 1500 chars côté app

    -- Prix
    prix DECIMAL(15, 2),
    devise VARCHAR(3) NOT NULL DEFAULT 'GNF',
    periode VARCHAR(20),                                    -- PAR_MOIS | PAR_AN | UNIQUE
    prix_sur_demande BOOLEAN NOT NULL DEFAULT FALSE,
    prix_negociable BOOLEAN NOT NULL DEFAULT FALSE,

    -- Caractéristiques
    nombre_chambres INT DEFAULT 0,
    nombre_salles_bain INT DEFAULT 1,
    surface_m2 DECIMAL(10, 2),
    nombre_etages INT,
    etage_situation INT,                                    -- pour appartement
    annee_construction INT,

    -- Conditions location (mois)
    mois_caution INT,
    mois_avance INT,
    mois_honoraire INT,

    -- Localisation
    localisation_id BIGINT,                                 -- FK vers localisations existante
    adresse_complete VARCHAR(500),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    position geography(Point, 4326),                        -- PostGIS : utilisé pour ST_DWithin / ST_Distance
    afficher_adresse_exacte BOOLEAN NOT NULL DEFAULT FALSE,

    -- Disponibilité & cycle de vie
    date_disponibilite DATE,
    statut VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    date_publication TIMESTAMP(6) WITH TIME ZONE,
    date_expiration TIMESTAMP(6) WITH TIME ZONE,
    nombre_renouvellements INT NOT NULL DEFAULT 0,
    motif_rejet TEXT,

    -- Contact public (affiché sur l'annonce)
    nom_contact_public VARCHAR(150),
    telephone_contact VARCHAR(20),

    -- Statistiques (mises à jour par triggers/services)
    nombre_vues INT NOT NULL DEFAULT 0,
    nombre_favoris INT NOT NULL DEFAULT 0,
    nombre_contacts INT NOT NULL DEFAULT 0,

    -- Premium (champs réservés - logique non implémentée)
    premium BOOLEAN NOT NULL DEFAULT FALSE,
    date_premium_fin TIMESTAMP(6) WITH TIME ZONE,

    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_immo_propriete_uuid UNIQUE (propriete_uuid),
    CONSTRAINT uq_immo_propriete_reference UNIQUE (reference),
    CONSTRAINT ck_immo_propriete_type_annonce CHECK (type_annonce IN ('LOCATION', 'VENTE')),
    CONSTRAINT ck_immo_propriete_duree CHECK (
        duree_location IS NULL OR duree_location IN ('COURT_SEJOUR', 'LONG_SEJOUR')
    ),
    CONSTRAINT ck_immo_propriete_periode CHECK (
        periode IS NULL OR periode IN ('PAR_MOIS', 'PAR_AN', 'UNIQUE')
    ),
    CONSTRAINT ck_immo_propriete_statut CHECK (statut IN (
        'BROUILLON', 'EN_ATTENTE_VALIDATION', 'PUBLIE',
        'RESERVE', 'VENDU', 'LOUE', 'RETIRE', 'SIGNALE'
    )),
    CONSTRAINT ck_immo_propriete_chambres CHECK (nombre_chambres >= 0 AND nombre_chambres <= 50),
    CONSTRAINT ck_immo_propriete_sb CHECK (nombre_salles_bain >= 0 AND nombre_salles_bain <= 50),
    CONSTRAINT fk_immo_propriete_profil FOREIGN KEY (profil_id)
        REFERENCES immo_profil (profil_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_immo_propriete_agence FOREIGN KEY (agence_id)
        REFERENCES immo_agence (agence_id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_immo_propriete_type_bien FOREIGN KEY (type_bien_id)
        REFERENCES immo_type_bien (type_bien_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_immo_propriete_localisation FOREIGN KEY (localisation_id)
        REFERENCES localisations (localisation_id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_immo_propriete_profil ON immo_propriete (profil_id);
CREATE INDEX IF NOT EXISTS idx_immo_propriete_agence ON immo_propriete (agence_id);
CREATE INDEX IF NOT EXISTS idx_immo_propriete_type_annonce ON immo_propriete (type_annonce);
CREATE INDEX IF NOT EXISTS idx_immo_propriete_type_bien ON immo_propriete (type_bien_id);
CREATE INDEX IF NOT EXISTS idx_immo_propriete_statut ON immo_propriete (statut);
CREATE INDEX IF NOT EXISTS idx_immo_propriete_localisation ON immo_propriete (localisation_id);
CREATE INDEX IF NOT EXISTS idx_immo_propriete_publication ON immo_propriete (date_publication DESC)
    WHERE statut = 'PUBLIE';
CREATE INDEX IF NOT EXISTS idx_immo_propriete_expiration ON immo_propriete (date_expiration)
    WHERE statut = 'PUBLIE';
CREATE INDEX IF NOT EXISTS idx_immo_propriete_prix ON immo_propriete (prix, devise)
    WHERE statut = 'PUBLIE' AND prix_sur_demande = FALSE;

-- Index spatial GiST : indispensable pour ST_DWithin (recherche par rayon)
CREATE INDEX IF NOT EXISTS idx_immo_propriete_position ON immo_propriete USING GIST (position);

-- =====================================================
-- 5. ASSOCIATION N:N PROPRIÉTÉ ↔ COMMODITÉS
-- =====================================================
CREATE TABLE IF NOT EXISTS immo_propriete_commodite (
    propriete_id BIGINT NOT NULL,
    commodite_id BIGINT NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (propriete_id, commodite_id),
    CONSTRAINT fk_immo_pc_propriete FOREIGN KEY (propriete_id)
        REFERENCES immo_propriete (propriete_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_immo_pc_commodite FOREIGN KEY (commodite_id)
        REFERENCES immo_commodite (commodite_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_immo_pc_commodite ON immo_propriete_commodite (commodite_id);

-- =====================================================
-- 6. PHOTOS (stockage MinIO, URL en base)
-- =====================================================
CREATE TABLE IF NOT EXISTS immo_photo (
    photo_id BIGSERIAL PRIMARY KEY,
    photo_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    propriete_id BIGINT NOT NULL,
    url VARCHAR(500) NOT NULL,                              -- URL MinIO bucket immo-photos
    url_thumbnail VARCHAR(500),                             -- URL MinIO bucket immo-photos-thumbnails
    object_key VARCHAR(500) NOT NULL,                       -- clé S3 (pour suppression)
    object_key_thumbnail VARCHAR(500),
    ordre_affichage INT NOT NULL DEFAULT 0,
    est_couverture BOOLEAN NOT NULL DEFAULT FALSE,
    taille_octets BIGINT,
    type_mime VARCHAR(50),
    largeur INT,
    hauteur INT,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_immo_photo_uuid UNIQUE (photo_uuid),
    CONSTRAINT fk_immo_photo_propriete FOREIGN KEY (propriete_id)
        REFERENCES immo_propriete (propriete_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_immo_photo_propriete ON immo_photo (propriete_id, ordre_affichage);
CREATE UNIQUE INDEX IF NOT EXISTS uq_immo_photo_cover_propriete ON immo_photo (propriete_id)
    WHERE est_couverture = TRUE;

-- =====================================================
-- 7. FAVORIS
-- =====================================================
CREATE TABLE IF NOT EXISTS immo_favori (
    favori_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    propriete_id BIGINT NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_immo_favori_user_propriete UNIQUE (user_id, propriete_id),
    CONSTRAINT fk_immo_favori_user FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_immo_favori_propriete FOREIGN KEY (propriete_id)
        REFERENCES immo_propriete (propriete_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_immo_favori_user ON immo_favori (user_id);

-- =====================================================
-- 8. SIGNALEMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS immo_signalement (
    signalement_id BIGSERIAL PRIMARY KEY,
    signalement_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    user_id BIGINT NOT NULL,                                -- auteur du signalement
    propriete_id BIGINT NOT NULL,
    motif VARCHAR(50) NOT NULL,                             -- FAUX | INAPPROPRIE | DEJA_VENDU | ARNAQUE | AUTRE
    description TEXT,
    statut VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
    traite_par BIGINT,                                      -- user admin
    date_traitement TIMESTAMP(6) WITH TIME ZONE,
    notes_admin TEXT,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_immo_signalement_uuid UNIQUE (signalement_uuid),
    CONSTRAINT ck_immo_signalement_motif CHECK (motif IN ('FAUX', 'INAPPROPRIE', 'DEJA_VENDU', 'ARNAQUE', 'AUTRE')),
    CONSTRAINT ck_immo_signalement_statut CHECK (statut IN ('EN_ATTENTE', 'TRAITE', 'REJETE')),
    CONSTRAINT fk_immo_signalement_user FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_immo_signalement_propriete FOREIGN KEY (propriete_id)
        REFERENCES immo_propriete (propriete_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_immo_signalement_admin FOREIGN KEY (traite_par)
        REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_immo_signalement_propriete ON immo_signalement (propriete_id);
CREATE INDEX IF NOT EXISTS idx_immo_signalement_statut ON immo_signalement (statut);

-- =====================================================
-- 9. CONTACTS ENTRANTS (demandes d'info)
-- =====================================================
CREATE TABLE IF NOT EXISTS immo_contact (
    contact_id BIGSERIAL PRIMARY KEY,
    contact_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    propriete_id BIGINT NOT NULL,
    demandeur_user_id BIGINT NOT NULL,
    nom_demandeur VARCHAR(150),
    telephone_demandeur VARCHAR(20),
    email_demandeur VARCHAR(150),
    message TEXT,
    type_demande VARCHAR(20) NOT NULL DEFAULT 'INFO',
    statut VARCHAR(20) NOT NULL DEFAULT 'NOUVEAU',
    vu_par_vendeur BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_immo_contact_uuid UNIQUE (contact_uuid),
    CONSTRAINT ck_immo_contact_type CHECK (type_demande IN ('INFO', 'VISITE', 'OFFRE')),
    CONSTRAINT ck_immo_contact_statut CHECK (statut IN ('NOUVEAU', 'TRAITE', 'CLOS')),
    CONSTRAINT fk_immo_contact_propriete FOREIGN KEY (propriete_id)
        REFERENCES immo_propriete (propriete_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_immo_contact_demandeur FOREIGN KEY (demandeur_user_id)
        REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_immo_contact_propriete ON immo_contact (propriete_id);
CREATE INDEX IF NOT EXISTS idx_immo_contact_demandeur ON immo_contact (demandeur_user_id);
CREATE INDEX IF NOT EXISTS idx_immo_contact_nouveau ON immo_contact (propriete_id)
    WHERE statut = 'NOUVEAU';

-- =====================================================
-- 10. VISITES PLANIFIÉES
-- =====================================================
CREATE TABLE IF NOT EXISTS immo_visite (
    visite_id BIGSERIAL PRIMARY KEY,
    visite_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    propriete_id BIGINT NOT NULL,
    visiteur_user_id BIGINT NOT NULL,
    date_visite DATE NOT NULL,
    heure_visite TIME,
    statut VARCHAR(20) NOT NULL DEFAULT 'DEMANDEE',
    notes_visiteur TEXT,
    notes_vendeur TEXT,
    motif_annulation TEXT,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_immo_visite_uuid UNIQUE (visite_uuid),
    CONSTRAINT ck_immo_visite_statut CHECK (statut IN ('DEMANDEE', 'CONFIRMEE', 'EFFECTUEE', 'ANNULEE')),
    CONSTRAINT fk_immo_visite_propriete FOREIGN KEY (propriete_id)
        REFERENCES immo_propriete (propriete_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_immo_visite_visiteur FOREIGN KEY (visiteur_user_id)
        REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_immo_visite_propriete ON immo_visite (propriete_id);
CREATE INDEX IF NOT EXISTS idx_immo_visite_visiteur ON immo_visite (visiteur_user_id);
CREATE INDEX IF NOT EXISTS idx_immo_visite_date ON immo_visite (date_visite, heure_visite)
    WHERE statut IN ('DEMANDEE', 'CONFIRMEE');

-- =====================================================
-- 11. TRANSACTIONS (ventes/locations effectives)
-- =====================================================
CREATE TABLE IF NOT EXISTS immo_transaction (
    transaction_id BIGSERIAL PRIMARY KEY,
    transaction_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    reference VARCHAR(30) NOT NULL,                         -- TRX-YYYYMMDD-XXXX (auto-généré)
    propriete_id BIGINT NOT NULL,
    acheteur_locataire_user_id BIGINT NOT NULL,
    vendeur_profil_id BIGINT NOT NULL,
    type_transaction VARCHAR(20) NOT NULL,                  -- LOCATION | VENTE
    montant DECIMAL(15, 2) NOT NULL,
    devise VARCHAR(3) NOT NULL DEFAULT 'GNF',
    date_transaction DATE NOT NULL,
    date_debut_location DATE,
    date_fin_location DATE,
    contrat_url VARCHAR(500),
    mode_reglement_id BIGINT,                               -- FK vers modes_reglement existante
    statut VARCHAR(20) NOT NULL DEFAULT 'EN_COURS',
    commission_agence DECIMAL(15, 2),
    notes TEXT,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_immo_transaction_uuid UNIQUE (transaction_uuid),
    CONSTRAINT uq_immo_transaction_reference UNIQUE (reference),
    CONSTRAINT ck_immo_transaction_type CHECK (type_transaction IN ('LOCATION', 'VENTE')),
    CONSTRAINT ck_immo_transaction_statut CHECK (statut IN ('EN_COURS', 'FINALISEE', 'RESILIEE')),
    CONSTRAINT fk_immo_transaction_propriete FOREIGN KEY (propriete_id)
        REFERENCES immo_propriete (propriete_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_immo_transaction_acheteur FOREIGN KEY (acheteur_locataire_user_id)
        REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_immo_transaction_vendeur FOREIGN KEY (vendeur_profil_id)
        REFERENCES immo_profil (profil_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_immo_transaction_mode FOREIGN KEY (mode_reglement_id)
        REFERENCES modes_reglement (mode_reglement_id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_immo_transaction_propriete ON immo_transaction (propriete_id);
CREATE INDEX IF NOT EXISTS idx_immo_transaction_acheteur ON immo_transaction (acheteur_locataire_user_id);
CREATE INDEX IF NOT EXISTS idx_immo_transaction_vendeur ON immo_transaction (vendeur_profil_id);
CREATE INDEX IF NOT EXISTS idx_immo_transaction_statut ON immo_transaction (statut);

-- =====================================================
-- 12. BROUILLONS WIZARD (sauvegarde multi-étapes)
-- =====================================================
CREATE TABLE IF NOT EXISTS immo_brouillon (
    brouillon_id BIGSERIAL PRIMARY KEY,
    brouillon_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    user_id BIGINT NOT NULL,
    donnees_json JSONB NOT NULL,                            -- état du formulaire wizard
    etape_actuelle INT NOT NULL DEFAULT 1,                  -- 1=Bien, 2=Lieu, 3=Prix, 4=Photos
    propriete_id BIGINT,                                    -- si déjà créée en BROUILLON
    derniere_modification TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_immo_brouillon_uuid UNIQUE (brouillon_uuid),
    CONSTRAINT ck_immo_brouillon_etape CHECK (etape_actuelle BETWEEN 1 AND 4),
    CONSTRAINT fk_immo_brouillon_user FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_immo_brouillon_propriete FOREIGN KEY (propriete_id)
        REFERENCES immo_propriete (propriete_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_immo_brouillon_user ON immo_brouillon (user_id);

-- =====================================================
-- 13. AVIS sur vendeurs/agences
-- =====================================================
CREATE TABLE IF NOT EXISTS immo_avis (
    avis_id BIGSERIAL PRIMARY KEY,
    avis_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    user_id BIGINT NOT NULL,                                -- auteur
    profil_id BIGINT,                                       -- cible : un vendeur
    agence_id BIGINT,                                       -- cible : une agence
    transaction_id BIGINT,                                  -- transaction associée
    note INT NOT NULL,
    commentaire TEXT,
    reponse TEXT,                                           -- réponse du vendeur/agence
    date_reponse TIMESTAMP(6) WITH TIME ZONE,
    visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_immo_avis_uuid UNIQUE (avis_uuid),
    CONSTRAINT ck_immo_avis_note CHECK (note BETWEEN 1 AND 5),
    CONSTRAINT ck_immo_avis_cible CHECK (
        (profil_id IS NOT NULL AND agence_id IS NULL)
        OR (profil_id IS NULL AND agence_id IS NOT NULL)
    ),
    CONSTRAINT fk_immo_avis_user FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_immo_avis_profil FOREIGN KEY (profil_id)
        REFERENCES immo_profil (profil_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_immo_avis_agence FOREIGN KEY (agence_id)
        REFERENCES immo_agence (agence_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_immo_avis_transaction FOREIGN KEY (transaction_id)
        REFERENCES immo_transaction (transaction_id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_immo_avis_profil ON immo_avis (profil_id) WHERE profil_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_immo_avis_agence ON immo_avis (agence_id) WHERE agence_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_immo_avis_user ON immo_avis (user_id);

-- =====================================================
-- 14. FONCTIONS & TRIGGERS
-- =====================================================

-- Génération automatique de la référence BIEN-YYYYMMDD-XXXX (séquence quotidienne)
CREATE OR REPLACE FUNCTION generate_reference_propriete()
RETURNS TRIGGER AS $$
DECLARE
    date_part TEXT;
    seq_part TEXT;
    next_seq INT;
BEGIN
    IF NEW.reference IS NULL OR NEW.reference = '' THEN
        date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
        SELECT COALESCE(MAX(
            CAST(SUBSTRING(reference FROM 15) AS INTEGER)
        ), 0) + 1
        INTO next_seq
        FROM immo_propriete
        WHERE reference LIKE 'BIEN-' || date_part || '-%';
        seq_part := LPAD(next_seq::TEXT, 4, '0');
        NEW.reference := 'BIEN-' || date_part || '-' || seq_part;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_immo_propriete_reference
BEFORE INSERT ON immo_propriete
FOR EACH ROW
EXECUTE FUNCTION generate_reference_propriete();

-- Génération automatique de la référence TRX-YYYYMMDD-XXXX
CREATE OR REPLACE FUNCTION generate_reference_transaction()
RETURNS TRIGGER AS $$
DECLARE
    date_part TEXT;
    seq_part TEXT;
    next_seq INT;
BEGIN
    IF NEW.reference IS NULL OR NEW.reference = '' THEN
        date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
        SELECT COALESCE(MAX(
            CAST(SUBSTRING(reference FROM 14) AS INTEGER)
        ), 0) + 1
        INTO next_seq
        FROM immo_transaction
        WHERE reference LIKE 'TRX-' || date_part || '-%';
        seq_part := LPAD(next_seq::TEXT, 4, '0');
        NEW.reference := 'TRX-' || date_part || '-' || seq_part;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_immo_transaction_reference
BEFORE INSERT ON immo_transaction
FOR EACH ROW
EXECUTE FUNCTION generate_reference_transaction();

-- Synchronisation position geography ↔ latitude/longitude (cohérence forte)
-- À l'insert/update : si latitude+longitude fournis, position est calculée.
CREATE OR REPLACE FUNCTION sync_immo_propriete_position()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.position := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    ELSE
        NEW.position := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_immo_propriete_position
BEFORE INSERT OR UPDATE OF latitude, longitude ON immo_propriete
FOR EACH ROW
EXECUTE FUNCTION sync_immo_propriete_position();

-- Mise à jour automatique du compteur nombre_favoris sur immo_propriete
CREATE OR REPLACE FUNCTION sync_immo_nombre_favoris()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE immo_propriete SET nombre_favoris = nombre_favoris + 1
            WHERE propriete_id = NEW.propriete_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE immo_propriete SET nombre_favoris = GREATEST(nombre_favoris - 1, 0)
            WHERE propriete_id = OLD.propriete_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_immo_favori_count
AFTER INSERT OR DELETE ON immo_favori
FOR EACH ROW
EXECUTE FUNCTION sync_immo_nombre_favoris();

-- Mise à jour automatique de la note moyenne du profil/agence sur INSERT/UPDATE/DELETE avis
CREATE OR REPLACE FUNCTION sync_immo_avis_aggregats()
RETURNS TRIGGER AS $$
DECLARE
    target_profil_id BIGINT;
    target_agence_id BIGINT;
BEGIN
    target_profil_id := COALESCE(NEW.profil_id, OLD.profil_id);
    target_agence_id := COALESCE(NEW.agence_id, OLD.agence_id);

    IF target_profil_id IS NOT NULL THEN
        UPDATE immo_profil
        SET note_moyenne = COALESCE((
                SELECT ROUND(AVG(note)::numeric, 2)
                FROM immo_avis
                WHERE profil_id = target_profil_id AND visible = TRUE
            ), 0),
            nombre_avis = (
                SELECT COUNT(*) FROM immo_avis
                WHERE profil_id = target_profil_id AND visible = TRUE
            )
        WHERE profil_id = target_profil_id;
    END IF;

    -- Pour les agences on garde juste un compteur basique côté service Phase 10
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_immo_avis_aggregats
AFTER INSERT OR UPDATE OR DELETE ON immo_avis
FOR EACH ROW
EXECUTE FUNCTION sync_immo_avis_aggregats();

-- Triggers updated_at (réutilise la fonction update_updated_at_column() définie en V3)
CREATE TRIGGER trg_immo_agence_updated_at BEFORE UPDATE ON immo_agence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_immo_profil_updated_at BEFORE UPDATE ON immo_profil
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_immo_type_bien_updated_at BEFORE UPDATE ON immo_type_bien
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_immo_commodite_updated_at BEFORE UPDATE ON immo_commodite
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_immo_propriete_updated_at BEFORE UPDATE ON immo_propriete
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_immo_visite_updated_at BEFORE UPDATE ON immo_visite
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_immo_transaction_updated_at BEFORE UPDATE ON immo_transaction
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_immo_avis_updated_at BEFORE UPDATE ON immo_avis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
