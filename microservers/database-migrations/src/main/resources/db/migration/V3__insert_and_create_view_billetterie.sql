-- =====================================================
-- PROJET DE BILLETTERIE DE TITRE TRANSPORT ROUTIER
-- Migration V3 - Insertions et Vues
-- CORRIGÉ : Ajout de DROP TRIGGER IF EXISTS
-- =====================================================

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

-- Insertion des modes de règlement (avec Credit Money ajouté)
INSERT INTO modes_reglement (libelle, code, description, frais_pourcentage) VALUES
                                                                                ('Espèces', 'CASH', 'Paiement en espèces au point de vente', 0),
                                                                                ('Orange Money', 'OM', 'Paiement via Orange Money', 1),
                                                                                ('MTN Mobile Money', 'MOMO', 'Paiement via MTN Mobile Money', 1),
                                                                                ('Credit Money', 'CM', 'Paiement via Credit Money', 1),
                                                                                ('Carte Bancaire', 'CB', 'Paiement par carte bancaire', 2),
                                                                                ('Virement', 'VIREMENT', 'Paiement par virement bancaire', 0)
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

-- =====================================================
-- SUPPRESSION DES TRIGGERS EXISTANTS (pour éviter les erreurs)
-- =====================================================

DROP TRIGGER IF EXISTS update_regions_updated_at ON regions;
DROP TRIGGER IF EXISTS update_villes_updated_at ON villes;
DROP TRIGGER IF EXISTS update_communes_updated_at ON communes;
DROP TRIGGER IF EXISTS update_quartiers_updated_at ON quartiers;
DROP TRIGGER IF EXISTS update_localisations_updated_at ON localisations;
DROP TRIGGER IF EXISTS update_sites_updated_at ON sites;
DROP TRIGGER IF EXISTS update_departs_updated_at ON departs;
DROP TRIGGER IF EXISTS update_arrivees_updated_at ON arrivees;
DROP TRIGGER IF EXISTS update_trajets_updated_at ON trajets;
DROP TRIGGER IF EXISTS update_types_vehicules_updated_at ON types_vehicules;
DROP TRIGGER IF EXISTS update_vehicules_updated_at ON vehicules;
DROP TRIGGER IF EXISTS update_offres_updated_at ON offres;
DROP TRIGGER IF EXISTS update_modes_reglement_updated_at ON modes_reglement;
DROP TRIGGER IF EXISTS update_commandes_updated_at ON commandes;
DROP TRIGGER IF EXISTS update_billets_updated_at ON billets;
DROP TRIGGER IF EXISTS update_paiements_updated_at ON paiements;
DROP TRIGGER IF EXISTS update_avis_updated_at ON avis;
DROP TRIGGER IF EXISTS update_partenaires_updated_at ON partenaires;

DROP TRIGGER IF EXISTS generate_commande_numero ON commandes;
DROP TRIGGER IF EXISTS generate_billet_code ON billets;
DROP TRIGGER IF EXISTS update_offre_places ON commandes;
DROP TRIGGER IF EXISTS update_vehicule_note ON avis;

-- =====================================================
-- CRÉATION DES TRIGGERS updated_at
-- =====================================================

CREATE TRIGGER update_regions_updated_at
    BEFORE UPDATE ON regions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_villes_updated_at
    BEFORE UPDATE ON villes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communes_updated_at
    BEFORE UPDATE ON communes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quartiers_updated_at
    BEFORE UPDATE ON quartiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_localisations_updated_at
    BEFORE UPDATE ON localisations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sites_updated_at
    BEFORE UPDATE ON sites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departs_updated_at
    BEFORE UPDATE ON departs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_arrivees_updated_at
    BEFORE UPDATE ON arrivees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trajets_updated_at
    BEFORE UPDATE ON trajets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_types_vehicules_updated_at
    BEFORE UPDATE ON types_vehicules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicules_updated_at
    BEFORE UPDATE ON vehicules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offres_updated_at
    BEFORE UPDATE ON offres
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modes_reglement_updated_at
    BEFORE UPDATE ON modes_reglement
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commandes_updated_at
    BEFORE UPDATE ON commandes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billets_updated_at
    BEFORE UPDATE ON billets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_paiements_updated_at
    BEFORE UPDATE ON paiements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_avis_updated_at
    BEFORE UPDATE ON avis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partenaires_updated_at
    BEFORE UPDATE ON partenaires
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CRÉATION DES TRIGGERS MÉTIER
-- =====================================================

CREATE TRIGGER generate_commande_numero
    BEFORE INSERT ON commandes
    FOR EACH ROW EXECUTE FUNCTION generate_numero_commande();

CREATE TRIGGER generate_billet_code
    BEFORE INSERT ON billets
    FOR EACH ROW EXECUTE FUNCTION generate_code_billet();

CREATE TRIGGER update_offre_places
    AFTER INSERT OR UPDATE ON commandes
                        FOR EACH ROW EXECUTE FUNCTION update_places_disponibles();

CREATE TRIGGER update_vehicule_note
    AFTER INSERT OR UPDATE ON avis
                        FOR EACH ROW EXECUTE FUNCTION update_vehicule_rating();

-- =====================================================
-- 14. VUES UTILES
-- =====================================================

-- Suppression des vues si elles existent
DROP VIEW IF EXISTS v_offres_disponibles;
DROP VIEW IF EXISTS v_reservations_details;

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
    o.heure_arrivee_estimee,
    o.nombre_places_disponibles,
    o.nombre_places_total,
    o.nombre_places_reservees,
    o.niveau_remplissage,
    o.montant,
    o.montant_promotion,
    o.devise,
    v.vehicule_id,
    v.immatriculation,
    v.marque || ' ' || v.modele AS vehicule,
    v.nom_chauffeur,
    v.contact_chauffeur,
    v.climatise,
    v.note_moyenne,
    v.nombre_avis,
    tv.libelle AS type_vehicule,
    o.statut,
    o.point_rencontre,
    o.conditions,
    o.annulation_autorisee,
    o.delai_annulation_heures
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
    c.commande_uuid,
    c.numero_commande,
    c.statut AS statut_commande,
    c.nombre_places,
    c.montant_unitaire,
    c.montant_total,
    c.montant_frais,
    c.montant_remise,
    c.montant_paye,
    c.devise,
    c.date_reservation,
    c.date_confirmation,
    c.date_paiement,
    c.reference_paiement,
    u.user_id AS client_id,
    u.username AS client_username,
    u.email AS client_email,
    u.phone AS client_phone,
    o.offre_id,
    o.date_depart,
    o.heure_depart,
    o.heure_arrivee_estimee,
    t.trajet_id,
    t.libelle_trajet,
    t.distance_km,
    t.duree_estimee_minutes,
    d.libelle AS depart,
    sd.nom AS site_depart,
    a.libelle AS arrivee,
    sa.nom AS site_arrivee,
    v.vehicule_id,
    v.immatriculation,
    v.marque || ' ' || v.modele AS vehicule,
    v.nom_chauffeur,
    v.contact_chauffeur,
    tv.libelle AS type_vehicule,
    mr.libelle AS mode_reglement
FROM commandes c
         JOIN users u ON u.user_id = c.user_id
         JOIN offres o ON o.offre_id = c.offre_id
         JOIN trajets t ON t.trajet_id = o.trajet_id
         JOIN departs d ON d.depart_id = t.depart_id
         JOIN sites sd ON sd.site_id = d.site_id
         JOIN arrivees a ON a.arrivee_id = t.arrivee_id
         JOIN sites sa ON sa.site_id = a.site_id
         JOIN vehicules v ON v.vehicule_id = o.vehicule_id
         LEFT JOIN types_vehicules tv ON tv.type_vehicule_id = v.type_vehicule_id
         LEFT JOIN modes_reglement mr ON mr.mode_reglement_id = c.mode_reglement_id;

-- =====================================================
-- VUE SUPPLÉMENTAIRE : Billets avec détails
-- =====================================================

DROP VIEW IF EXISTS v_billets_details;

CREATE OR REPLACE VIEW v_billets_details AS
SELECT
    b.billet_id,
    b.billet_uuid,
    b.code_billet,
    b.numero_siege,
    b.nom_passager,
    b.telephone_passager,
    b.piece_identite,
    b.statut AS statut_billet,
    b.date_validation,
    b.created_at AS date_emission,
    c.numero_commande,
    c.statut AS statut_commande,
    o.date_depart,
    o.heure_depart,
    t.libelle_trajet,
    d.libelle AS depart,
    sd.nom AS site_depart,
    a.libelle AS arrivee,
    sa.nom AS site_arrivee,
    v.immatriculation,
    v.nom_chauffeur,
    v.contact_chauffeur,
    o.point_rencontre
FROM billets b
         JOIN commandes c ON c.commande_id = b.commande_id
         JOIN offres o ON o.offre_id = c.offre_id
         JOIN trajets t ON t.trajet_id = o.trajet_id
         JOIN departs d ON d.depart_id = t.depart_id
         JOIN sites sd ON sd.site_id = d.site_id
         JOIN arrivees a ON a.arrivee_id = t.arrivee_id
         JOIN sites sa ON sa.site_id = a.site_id
         JOIN vehicules v ON v.vehicule_id = o.vehicule_id;

-- =====================================================
-- FIN DU SCRIPT V3
-- =====================================================