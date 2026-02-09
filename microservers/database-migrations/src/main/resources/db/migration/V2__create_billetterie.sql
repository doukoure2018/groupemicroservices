
-- Extension pour générer des UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. TABLES DE RÉFÉRENCE GÉOGRAPHIQUE
-- =====================================================

-- Table des régions
CREATE TABLE IF NOT EXISTS regions (
                                       region_id BIGSERIAL PRIMARY KEY,
                                       region_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    libelle VARCHAR(100) NOT NULL,
    code VARCHAR(10),
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT uq_regions_uuid UNIQUE (region_uuid),
    CONSTRAINT uq_regions_libelle UNIQUE (libelle)
    );

-- Table des villes/préfectures
CREATE TABLE IF NOT EXISTS villes (
                                      ville_id BIGSERIAL PRIMARY KEY,
                                      ville_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    region_id BIGINT NOT NULL,
    libelle VARCHAR(100) NOT NULL,
    code_postal VARCHAR(10),
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT uq_villes_uuid UNIQUE (ville_uuid),
    CONSTRAINT fk_villes_region FOREIGN KEY (region_id)
    REFERENCES regions (region_id) ON UPDATE CASCADE ON DELETE RESTRICT
    );

-- Table des communes/districts
CREATE TABLE IF NOT EXISTS communes (
                                        commune_id BIGSERIAL PRIMARY KEY,
                                        commune_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    ville_id BIGINT NOT NULL,
    libelle VARCHAR(100) NOT NULL,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT uq_communes_uuid UNIQUE (commune_uuid),
    CONSTRAINT fk_communes_ville FOREIGN KEY (ville_id)
    REFERENCES villes (ville_id) ON UPDATE CASCADE ON DELETE RESTRICT
    );

-- Table des quartiers
CREATE TABLE IF NOT EXISTS quartiers (
                                         quartier_id BIGSERIAL PRIMARY KEY,
                                         quartier_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    commune_id BIGINT NOT NULL,
    libelle VARCHAR(100) NOT NULL,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT uq_quartiers_uuid UNIQUE (quartier_uuid),
    CONSTRAINT fk_quartiers_commune FOREIGN KEY (commune_id)
    REFERENCES communes (commune_id) ON UPDATE CASCADE ON DELETE RESTRICT
    );

-- Table des localisations (adresses complètes)
CREATE TABLE IF NOT EXISTS localisations (
                                             localisation_id BIGSERIAL PRIMARY KEY,
                                             localisation_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    quartier_id BIGINT,
    adresse_complete VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    description TEXT,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT uq_localisations_uuid UNIQUE (localisation_uuid),
    CONSTRAINT fk_localisations_quartier FOREIGN KEY (quartier_id)
    REFERENCES quartiers (quartier_id) ON UPDATE CASCADE ON DELETE SET NULL
    );

-- =====================================================
-- 2. TABLES DES GARES ET SITES
-- =====================================================

-- Table des sites/gares routières
CREATE TABLE IF NOT EXISTS sites (
                                     site_id BIGSERIAL PRIMARY KEY,
                                     site_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    localisation_id BIGINT NOT NULL,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    type_site VARCHAR(50) DEFAULT 'GARE_ROUTIERE', -- GARE_ROUTIERE, POINT_RELAIS, AGENCE
    capacite_vehicules INTEGER,
    telephone VARCHAR(20),
    email VARCHAR(100),
    horaire_ouverture TIME,
    horaire_fermeture TIME,
    image_url VARCHAR(255),
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT uq_sites_uuid UNIQUE (site_uuid),
    CONSTRAINT fk_sites_localisation FOREIGN KEY (localisation_id)
    REFERENCES localisations (localisation_id) ON UPDATE CASCADE ON DELETE RESTRICT
    );

-- Table des points de départ
CREATE TABLE IF NOT EXISTS departs (
                                       depart_id BIGSERIAL PRIMARY KEY,
                                       depart_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    site_id BIGINT NOT NULL,
    libelle VARCHAR(100) NOT NULL,
    description TEXT,
    ordre_affichage INTEGER DEFAULT 0,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT uq_departs_uuid UNIQUE (depart_uuid),
    CONSTRAINT fk_departs_site FOREIGN KEY (site_id)
    REFERENCES sites (site_id) ON UPDATE CASCADE ON DELETE RESTRICT
    );

-- Table des points d'arrivée
CREATE TABLE IF NOT EXISTS arrivees (
                                        arrivee_id BIGSERIAL PRIMARY KEY,
                                        arrivee_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    site_id BIGINT NOT NULL,
    depart_id BIGINT NOT NULL,
    libelle VARCHAR(100) NOT NULL,
    libelle_depart VARCHAR(100), -- Pour affichage rapide
    description TEXT,
    ordre_affichage INTEGER DEFAULT 0,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT uq_arrivees_uuid UNIQUE (arrivee_uuid),
    CONSTRAINT fk_arrivees_site FOREIGN KEY (site_id)
    REFERENCES sites (site_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_arrivees_depart FOREIGN KEY (depart_id)
    REFERENCES departs (depart_id) ON UPDATE CASCADE ON DELETE RESTRICT
    );

-- =====================================================
-- 3. TABLES DES TRAJETS
-- =====================================================

-- Table des trajets
CREATE TABLE IF NOT EXISTS trajets (
                                       trajet_id BIGSERIAL PRIMARY KEY,
                                       trajet_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    depart_id BIGINT NOT NULL,
    arrivee_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL, -- Responsable qui a créé le trajet
    libelle_trajet VARCHAR(150),
    distance_km DECIMAL(10, 2),
    duree_estimee_minutes INTEGER NOT NULL,
    montant_base DECIMAL(15, 2) NOT NULL,
    montant_bagages DECIMAL(15, 2) DEFAULT 0,
    devise VARCHAR(3) DEFAULT 'GNF',
    description TEXT,
    instructions TEXT, -- Instructions pour les passagers
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT uq_trajets_uuid UNIQUE (trajet_uuid),
    CONSTRAINT fk_trajets_depart FOREIGN KEY (depart_id)
    REFERENCES departs (depart_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_trajets_arrivee FOREIGN KEY (arrivee_id)
    REFERENCES arrivees (arrivee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_trajets_user FOREIGN KEY (user_id)
    REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT
    );

-- Index pour optimiser les recherches de trajets
CREATE INDEX idx_trajets_depart_arrivee ON trajets (depart_id, arrivee_id);
CREATE INDEX idx_trajets_actif ON trajets (actif) WHERE actif = TRUE;

-- =====================================================
-- 4. TABLES DES VÉHICULES ET TRANSPORTEURS
-- =====================================================

-- Table des types de véhicules
CREATE TABLE IF NOT EXISTS types_vehicules (
                                               type_vehicule_id BIGSERIAL PRIMARY KEY,
                                               type_vehicule_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    libelle VARCHAR(50) NOT NULL, -- Bus, Minibus, Taxi-brousse, etc.
    description TEXT,
    capacite_min INTEGER,
    capacite_max INTEGER,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT uq_types_vehicules_uuid UNIQUE (type_vehicule_uuid),
    CONSTRAINT uq_types_vehicules_libelle UNIQUE (libelle)
    );

-- Table des véhicules
CREATE TABLE IF NOT EXISTS vehicules (
                                         vehicule_id BIGSERIAL PRIMARY KEY,
                                         vehicule_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    user_id BIGINT NOT NULL, -- Propriétaire/transporteur
    type_vehicule_id BIGINT,
    immatriculation VARCHAR(20) NOT NULL,
    marque VARCHAR(50),
    modele VARCHAR(50),
    annee_fabrication INTEGER,
    nombre_places INTEGER NOT NULL,
    nom_chauffeur VARCHAR(100) NOT NULL,
    contact_chauffeur VARCHAR(20) NOT NULL,
    contact_proprietaire VARCHAR(20),
    description TEXT,
    couleur VARCHAR(30),
    climatise BOOLEAN DEFAULT FALSE,
    image_url VARCHAR(255),
    image_data BYTEA, -- Pour stocker l'image directement
    image_type VARCHAR(50),
    document_assurance_url VARCHAR(255),
    date_expiration_assurance DATE,
    document_visite_technique_url VARCHAR(255),
    date_expiration_visite DATE,
    statut VARCHAR(20) DEFAULT 'ACTIF', -- ACTIF, INACTIF, EN_MAINTENANCE, SUSPENDU
    note_moyenne DECIMAL(3, 2) DEFAULT 0,
    nombre_avis INTEGER DEFAULT 0,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT uq_vehicules_uuid UNIQUE (vehicule_uuid),
    CONSTRAINT uq_vehicules_immatriculation UNIQUE (immatriculation),
    CONSTRAINT fk_vehicules_user FOREIGN KEY (user_id)
    REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_vehicules_type FOREIGN KEY (type_vehicule_id)
    REFERENCES types_vehicules (type_vehicule_id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_vehicules_places CHECK (nombre_places > 0 AND nombre_places <= 100)
    );

CREATE INDEX idx_vehicules_user ON vehicules (user_id);
CREATE INDEX idx_vehicules_statut ON vehicules (statut);

-- =====================================================
-- 5. TABLES DES OFFRES DE TRANSPORT
-- =====================================================

-- Table des offres de voyage
CREATE TABLE IF NOT EXISTS offres (
                                      offre_id BIGSERIAL PRIMARY KEY,
                                      offre_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    token_offre VARCHAR(100) UNIQUE, -- Token unique pour référence
    trajet_id BIGINT NOT NULL,
    vehicule_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL, -- Responsable qui publie l'offre
    date_depart DATE NOT NULL,
    heure_depart TIME NOT NULL,
    heure_arrivee_estimee TIME,
    nombre_places_total INTEGER NOT NULL,
    nombre_places_disponibles INTEGER NOT NULL,
    nombre_places_reservees INTEGER DEFAULT 0,
    montant DECIMAL(15, 2) NOT NULL,
    montant_promotion DECIMAL(15, 2), -- Prix promotionnel si applicable
    devise VARCHAR(3) DEFAULT 'GNF',
    statut VARCHAR(20) DEFAULT 'EN_ATTENTE', -- EN_ATTENTE, OUVERT, COMPLET, EN_COURS, TERMINE, ANNULE
    niveau_remplissage INTEGER DEFAULT 0, -- Pourcentage de remplissage
    point_rencontre TEXT, -- Instructions de rendez-vous
    conditions TEXT,
    annulation_autorisee BOOLEAN DEFAULT TRUE,
    delai_annulation_heures INTEGER DEFAULT 24,
    date_publication TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                      date_cloture TIMESTAMP(6) WITH TIME ZONE,
                                      date_depart_effectif TIMESTAMP(6) WITH TIME ZONE,
                                      date_arrivee_effective TIMESTAMP(6) WITH TIME ZONE,
                                      created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                      updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                      CONSTRAINT uq_offres_uuid UNIQUE (offre_uuid),
    CONSTRAINT fk_offres_trajet FOREIGN KEY (trajet_id)
    REFERENCES trajets (trajet_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_offres_vehicule FOREIGN KEY (vehicule_id)
    REFERENCES vehicules (vehicule_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_offres_user FOREIGN KEY (user_id)
    REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_offres_places CHECK (nombre_places_disponibles >= 0 AND nombre_places_disponibles <= nombre_places_total)
    );

CREATE INDEX idx_offres_trajet ON offres (trajet_id);
CREATE INDEX idx_offres_date_depart ON offres (date_depart);
CREATE INDEX idx_offres_statut ON offres (statut);
CREATE INDEX idx_offres_recherche ON offres (trajet_id, date_depart, statut) WHERE statut IN ('EN_ATTENTE', 'OUVERT');

-- =====================================================
-- 6. TABLES DES COMMANDES ET RÉSERVATIONS
-- =====================================================

-- Table des modes de règlement
CREATE TABLE IF NOT EXISTS modes_reglement (
                                               mode_reglement_id BIGSERIAL PRIMARY KEY,
                                               mode_reglement_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    libelle VARCHAR(50) NOT NULL, -- ESPECES, MOBILE_MONEY, CARTE_BANCAIRE, VIREMENT
    code VARCHAR(20) NOT NULL,
    description TEXT,
    icone_url VARCHAR(255),
    frais_pourcentage DECIMAL(5, 2) DEFAULT 0,
    frais_fixe DECIMAL(10, 2) DEFAULT 0,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT uq_modes_reglement_uuid UNIQUE (mode_reglement_uuid),
    CONSTRAINT uq_modes_reglement_code UNIQUE (code)
    );

-- Table des commandes/réservations
CREATE TABLE IF NOT EXISTS commandes (
                                         commande_id BIGSERIAL PRIMARY KEY,
                                         commande_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    numero_commande VARCHAR(20) NOT NULL UNIQUE, -- Numéro lisible : CMD-YYYYMMDD-XXXX
    offre_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL, -- Client qui réserve
    mode_reglement_id BIGINT,
    nombre_places INTEGER NOT NULL DEFAULT 1,
    montant_unitaire DECIMAL(15, 2) NOT NULL,
    montant_total DECIMAL(15, 2) NOT NULL,
    montant_frais DECIMAL(15, 2) DEFAULT 0,
    montant_remise DECIMAL(15, 2) DEFAULT 0,
    montant_paye DECIMAL(15, 2) DEFAULT 0,
    devise VARCHAR(3) DEFAULT 'GNF',
    statut VARCHAR(20) DEFAULT 'EN_ATTENTE', -- EN_ATTENTE, CONFIRMEE, PAYEE, ANNULEE, REMBOURSEE, UTILISEE
    date_reservation TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                      date_confirmation TIMESTAMP(6) WITH TIME ZONE,
                                      date_paiement TIMESTAMP(6) WITH TIME ZONE,
                                      date_annulation TIMESTAMP(6) WITH TIME ZONE,
                                      motif_annulation TEXT,
                                      reference_paiement VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                      updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                      CONSTRAINT uq_commandes_uuid UNIQUE (commande_uuid),
    CONSTRAINT fk_commandes_offre FOREIGN KEY (offre_id)
    REFERENCES offres (offre_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_commandes_user FOREIGN KEY (user_id)
    REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_commandes_mode_reglement FOREIGN KEY (mode_reglement_id)
    REFERENCES modes_reglement (mode_reglement_id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_commandes_places CHECK (nombre_places > 0)
    );

CREATE INDEX idx_commandes_offre ON commandes (offre_id);
CREATE INDEX idx_commandes_user ON commandes (user_id);
CREATE INDEX idx_commandes_statut ON commandes (statut);
CREATE INDEX idx_commandes_numero ON commandes (numero_commande);

-- Table des billets/tickets
CREATE TABLE IF NOT EXISTS billets (
                                       billet_id BIGSERIAL PRIMARY KEY,
                                       billet_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    commande_id BIGINT NOT NULL,
    code_billet VARCHAR(20) NOT NULL UNIQUE, -- Code QR/Barcode
    numero_siege VARCHAR(10),
    nom_passager VARCHAR(100),
    telephone_passager VARCHAR(20),
    piece_identite VARCHAR(50),
    statut VARCHAR(20) DEFAULT 'VALIDE', -- VALIDE, UTILISE, ANNULE, EXPIRE
    date_validation TIMESTAMP(6) WITH TIME ZONE,
                                     valide_par BIGINT, -- User qui a validé le billet
                                     qr_code_data TEXT,
                                     created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                     updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                     CONSTRAINT uq_billets_uuid UNIQUE (billet_uuid),
    CONSTRAINT fk_billets_commande FOREIGN KEY (commande_id)
    REFERENCES commandes (commande_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_billets_validateur FOREIGN KEY (valide_par)
    REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE SET NULL
    );

CREATE INDEX idx_billets_commande ON billets (commande_id);
CREATE INDEX idx_billets_code ON billets (code_billet);
CREATE INDEX idx_billets_statut ON billets (statut);

-- =====================================================
-- 7. TABLES DES PAIEMENTS
-- =====================================================

-- Table des transactions de paiement
CREATE TABLE IF NOT EXISTS paiements (
                                         paiement_id BIGSERIAL PRIMARY KEY,
                                         paiement_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    commande_id BIGINT NOT NULL,
    mode_reglement_id BIGINT NOT NULL,
    montant DECIMAL(15, 2) NOT NULL,
    devise VARCHAR(3) DEFAULT 'GNF',
    reference_externe VARCHAR(100), -- Référence du système de paiement externe
    statut VARCHAR(20) DEFAULT 'EN_ATTENTE', -- EN_ATTENTE, REUSSI, ECHOUE, REMBOURSE
    date_transaction TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                      date_confirmation TIMESTAMP(6) WITH TIME ZONE,
                                      metadata JSONB, -- Données supplémentaires du paiement
                                      created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                      updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                      CONSTRAINT uq_paiements_uuid UNIQUE (paiement_uuid),
    CONSTRAINT fk_paiements_commande FOREIGN KEY (commande_id)
    REFERENCES commandes (commande_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_paiements_mode FOREIGN KEY (mode_reglement_id)
    REFERENCES modes_reglement (mode_reglement_id) ON UPDATE CASCADE ON DELETE RESTRICT
    );

CREATE INDEX idx_paiements_commande ON paiements (commande_id);
CREATE INDEX idx_paiements_statut ON paiements (statut);

-- =====================================================
-- 8. TABLES DES NOTIFICATIONS
-- =====================================================

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
                                             notification_id BIGSERIAL PRIMARY KEY,
                                             notification_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    user_id BIGINT NOT NULL,
    type_notification VARCHAR(50) NOT NULL, -- SMS, EMAIL, PUSH, IN_APP
    categorie VARCHAR(50), -- RESERVATION, PAIEMENT, DEPART, PROMOTION
    titre VARCHAR(200),
    message TEXT NOT NULL,
    lue BOOLEAN DEFAULT FALSE,
    envoyee BOOLEAN DEFAULT FALSE,
    date_envoi TIMESTAMP(6) WITH TIME ZONE,
                                date_lecture TIMESTAMP(6) WITH TIME ZONE,
                                reference_id BIGINT, -- ID de l'objet concerné (commande, offre, etc.)
                                reference_type VARCHAR(50), -- Type de l'objet (COMMANDE, OFFRE, etc.)
    metadata JSONB,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT uq_notifications_uuid UNIQUE (notification_uuid),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
    REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE CASCADE
    );

CREATE INDEX idx_notifications_user ON notifications (user_id);
CREATE INDEX idx_notifications_lue ON notifications (user_id, lue) WHERE lue = FALSE;

-- =====================================================
-- 9. TABLES DES AVIS ET ÉVALUATIONS
-- =====================================================

-- Table des avis
CREATE TABLE IF NOT EXISTS avis (
                                    avis_id BIGSERIAL PRIMARY KEY,
                                    avis_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    user_id BIGINT NOT NULL, -- Utilisateur qui donne l'avis
    commande_id BIGINT NOT NULL,
    vehicule_id BIGINT,
    note INTEGER NOT NULL, -- 1 à 5
    commentaire TEXT,
    reponse TEXT, -- Réponse du transporteur
    date_reponse TIMESTAMP(6) WITH TIME ZONE,
                                  visible BOOLEAN DEFAULT TRUE,
                                  created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                  updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                  CONSTRAINT uq_avis_uuid UNIQUE (avis_uuid),
    CONSTRAINT uq_avis_commande UNIQUE (commande_id), -- Un seul avis par commande
    CONSTRAINT fk_avis_user FOREIGN KEY (user_id)
    REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_avis_commande FOREIGN KEY (commande_id)
    REFERENCES commandes (commande_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_avis_vehicule FOREIGN KEY (vehicule_id)
    REFERENCES vehicules (vehicule_id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_avis_note CHECK (note >= 1 AND note <= 5)
    );

CREATE INDEX idx_avis_vehicule ON avis (vehicule_id);

-- =====================================================
-- 10. TABLES DES PARTENAIRES ET DISTRIBUTEURS
-- =====================================================

-- Table des partenaires/distributeurs
CREATE TABLE IF NOT EXISTS partenaires (
                                           partenaire_id BIGSERIAL PRIMARY KEY,
                                           partenaire_uuid VARCHAR(40) NOT NULL DEFAULT uuid_generate_v4(),
    localisation_id BIGINT,
    nom VARCHAR(100) NOT NULL,
    type_partenaire VARCHAR(50), -- MICROFINANCE, COMMERCE, AGENCE, POINT_VENTE
    raison_sociale VARCHAR(150),
    numero_registre VARCHAR(50),
    telephone VARCHAR(20),
    email VARCHAR(100),
    adresse TEXT,
    logo_url VARCHAR(255),
    commission_pourcentage DECIMAL(5, 2) DEFAULT 0,
    commission_fixe DECIMAL(10, 2) DEFAULT 0,
    responsable_nom VARCHAR(100),
    responsable_telephone VARCHAR(20),
    statut VARCHAR(20) DEFAULT 'ACTIF', -- ACTIF, INACTIF, SUSPENDU
    date_debut_partenariat DATE,
    date_fin_partenariat DATE,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT uq_partenaires_uuid UNIQUE (partenaire_uuid),
    CONSTRAINT fk_partenaires_localisation FOREIGN KEY (localisation_id)
    REFERENCES localisations (localisation_id) ON UPDATE CASCADE ON DELETE SET NULL
    );

-- =====================================================
-- 11. TABLES D'AUDIT ET LOGS
-- =====================================================

-- Table des logs d'activité
CREATE TABLE IF NOT EXISTS audit_logs (
                                          log_id BIGSERIAL PRIMARY KEY,
                                          user_id BIGINT,
                                          action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    entite VARCHAR(50) NOT NULL, -- Nom de la table/entité concernée
    entite_id BIGINT,
    anciennes_valeurs JSONB,
    nouvelles_valeurs JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id)
    REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE SET NULL
    );

CREATE INDEX idx_audit_logs_user ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_entite ON audit_logs (entite, entite_id);
CREATE INDEX idx_audit_logs_date ON audit_logs (created_at);

-- =====================================================
-- 12. DONNÉES INITIALES
-- =====================================================

-- Insertion des types de véhicules
INSERT INTO types_vehicules (libelle, description, capacite_min, capacite_max) VALUES
                                                                                   ('Bus', 'Grand bus de transport interurbain', 40, 70),
                                                                                   ('Minibus', 'Minibus de transport', 15, 30),
                                                                                   ('Taxi-brousse', 'Véhicule de type break ou berline', 4, 9),
                                                                                   ('4x4', 'Véhicule tout-terrain', 4, 8),
                                                                                   ('Van', 'Véhicule utilitaire aménagé', 8, 15)
    ON CONFLICT (libelle) DO NOTHING;

-- Insertion des modes de règlement
INSERT INTO modes_reglement (libelle, code, description) VALUES
                                                             ('Espèces', 'CASH', 'Paiement en espèces au point de vente'),
                                                             ('Orange Money', 'OM', 'Paiement via Orange Money'),
                                                             ('MTN Mobile Money', 'MOMO', 'Paiement via MTN Mobile Money'),
                                                             ('Carte Bancaire', 'CB', 'Paiement par carte bancaire'),
                                                             ('Virement', 'VIREMENT', 'Paiement par virement bancaire')
    ON CONFLICT (code) DO NOTHING;

-- Insertion des régions de Guinée
INSERT INTO regions (libelle, code) VALUES
                                        ('Conakry', 'CKY'),
                                        ('Kindia', 'KND'),
                                        ('Boké', 'BOK'),
                                        ('Mamou', 'MAM'),
                                        ('Labé', 'LAB'),
                                        ('Faranah', 'FAR'),
                                        ('Kankan', 'KAN'),
                                        ('Nzérékoré', 'NZR')
    ON CONFLICT (libelle) DO NOTHING;

-- =====================================================
-- 13. FONCTIONS ET TRIGGERS
-- =====================================================

-- Fonction pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';

-- Fonction pour générer un numéro de commande
CREATE OR REPLACE FUNCTION generate_numero_commande()
RETURNS TRIGGER AS $$
DECLARE
seq_num INTEGER;
BEGIN
SELECT COALESCE(MAX(CAST(SUBSTRING(numero_commande FROM 13) AS INTEGER)), 0) + 1
INTO seq_num
FROM commandes
WHERE DATE(created_at) = CURRENT_DATE;

NEW.numero_commande := 'CMD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(seq_num::TEXT, 4, '0');
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer un code billet
CREATE OR REPLACE FUNCTION generate_code_billet()
RETURNS TRIGGER AS $$
BEGIN
    NEW.code_billet := 'TKT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour les places disponibles
CREATE OR REPLACE FUNCTION update_places_disponibles()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.statut IN ('CONFIRMEE', 'PAYEE') THEN
UPDATE offres
SET nombre_places_disponibles = nombre_places_disponibles - NEW.nombre_places,
    nombre_places_reservees = nombre_places_reservees + NEW.nombre_places,
    niveau_remplissage = ROUND(((nombre_places_reservees + NEW.nombre_places)::NUMERIC / nombre_places_total) * 100),
    statut = CASE
                 WHEN nombre_places_disponibles - NEW.nombre_places <= 0 THEN 'COMPLET'
                 ELSE statut
        END
WHERE offre_id = NEW.offre_id;
ELSIF TG_OP = 'UPDATE' AND OLD.statut != 'ANNULEE' AND NEW.statut = 'ANNULEE' THEN
UPDATE offres
SET nombre_places_disponibles = nombre_places_disponibles + OLD.nombre_places,
    nombre_places_reservees = nombre_places_reservees - OLD.nombre_places,
    niveau_remplissage = ROUND(((nombre_places_reservees - OLD.nombre_places)::NUMERIC / nombre_places_total) * 100),
    statut = CASE
                 WHEN statut = 'COMPLET' THEN 'OUVERT'
                 ELSE statut
        END
WHERE offre_id = OLD.offre_id;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour la note moyenne du véhicule
CREATE OR REPLACE FUNCTION update_vehicule_rating()
RETURNS TRIGGER AS $$
BEGIN
UPDATE vehicules
SET note_moyenne = (
    SELECT ROUND(AVG(note)::NUMERIC, 2)
    FROM avis
    WHERE vehicule_id = NEW.vehicule_id AND visible = TRUE
),
    nombre_avis = (
        SELECT COUNT(*)
        FROM avis
        WHERE vehicule_id = NEW.vehicule_id AND visible = TRUE
    )
WHERE vehicule_id = NEW.vehicule_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Application des triggers updated_at
CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON regions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_villes_updated_at BEFORE UPDATE ON villes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_communes_updated_at BEFORE UPDATE ON communes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quartiers_updated_at BEFORE UPDATE ON quartiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_localisations_updated_at BEFORE UPDATE ON localisations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departs_updated_at BEFORE UPDATE ON departs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_arrivees_updated_at BEFORE UPDATE ON arrivees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trajets_updated_at BEFORE UPDATE ON trajets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_types_vehicules_updated_at BEFORE UPDATE ON types_vehicules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicules_updated_at BEFORE UPDATE ON vehicules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offres_updated_at BEFORE UPDATE ON offres FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modes_reglement_updated_at BEFORE UPDATE ON modes_reglement FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commandes_updated_at BEFORE UPDATE ON commandes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billets_updated_at BEFORE UPDATE ON billets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_paiements_updated_at BEFORE UPDATE ON paiements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_avis_updated_at BEFORE UPDATE ON avis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partenaires_updated_at BEFORE UPDATE ON partenaires FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers métier
CREATE TRIGGER generate_commande_numero BEFORE INSERT ON commandes FOR EACH ROW EXECUTE FUNCTION generate_numero_commande();
CREATE TRIGGER generate_billet_code BEFORE INSERT ON billets FOR EACH ROW EXECUTE FUNCTION generate_code_billet();
CREATE TRIGGER update_offre_places AFTER INSERT OR UPDATE ON commandes FOR EACH ROW EXECUTE FUNCTION update_places_disponibles();
CREATE TRIGGER update_vehicule_note AFTER INSERT OR UPDATE ON avis FOR EACH ROW EXECUTE FUNCTION update_vehicule_rating();

-- =====================================================
-- 14. VUES UTILES
-- =====================================================

-- Vue des offres disponibles avec détails
CREATE OR REPLACE VIEW v_offres_disponibles AS
SELECT
    o.offre_id,
    o.offre_uuid,
    o.token_offre,
    t.libelle_trajet,
    d.libelle AS depart_libelle,
    sd.nom AS site_depart,
    a.libelle AS arrivee_libelle,
    sa.nom AS site_arrivee,
    o.date_depart,
    o.heure_depart,
    o.nombre_places_disponibles,
    o.nombre_places_total,
    o.niveau_remplissage,
    o.montant,
    o.devise,
    v.marque || ' ' || v.modele AS vehicule,
    v.nom_chauffeur,
    v.contact_chauffeur,
    tv.libelle AS type_vehicule,
    o.statut
FROM offres o
         JOIN trajets t ON t.trajet_id = o.trajet_id
         JOIN departs d ON d.depart_id = t.depart_id
         JOIN sites sd ON sd.site_id = d.site_id
         JOIN arrivees a ON a.arrivee_id = t.arrivee_id
         JOIN sites sa ON sa.site_id = a.site_id
         JOIN vehicules v ON v.vehicule_id = o.vehicule_id
         LEFT JOIN types_vehicules tv ON tv.type_vehicule_id = v.type_vehicule_id
WHERE o.statut IN ('EN_ATTENTE', 'OUVERT')
  AND o.date_depart >= CURRENT_DATE
ORDER BY o.date_depart, o.heure_depart;

-- Vue des réservations avec détails
CREATE OR REPLACE VIEW v_reservations_details AS
SELECT
    c.commande_id,
    c.numero_commande,
    c.statut AS statut_commande,
    c.nombre_places,
    c.montant_total,
    c.date_reservation,
    u.username AS client_username,
    u.email AS client_email,
    u.phone AS client_phone,
    o.date_depart,
    o.heure_depart,
    t.libelle_trajet,
    d.libelle AS depart,
    a.libelle AS arrivee,
    v.nom_chauffeur,
    v.contact_chauffeur
FROM commandes c
         JOIN users u ON u.user_id = c.user_id
         JOIN offres o ON o.offre_id = c.offre_id
         JOIN trajets t ON t.trajet_id = o.trajet_id
         JOIN departs d ON d.depart_id = t.depart_id
         JOIN arrivees a ON a.arrivee_id = t.arrivee_id
         JOIN vehicules v ON v.vehicule_id = o.vehicule_id;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================