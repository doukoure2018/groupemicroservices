-- Fix column sizes for OAuth2 users
-- Email addresses from Google can be longer than 25 characters

-- Drop the view that depends on username column
DROP VIEW IF EXISTS v_reservations_details;

-- Increase username column size (used as email for OAuth2 users)
ALTER TABLE users ALTER COLUMN username TYPE VARCHAR(255);

-- Increase first_name column size
ALTER TABLE users ALTER COLUMN first_name TYPE VARCHAR(100);

-- Increase last_name column size
ALTER TABLE users ALTER COLUMN last_name TYPE VARCHAR(100);

-- Ensure email column is large enough
ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(255);

-- Fix phone column type if needed (should be VARCHAR, not numeric)
ALTER TABLE users ALTER COLUMN phone TYPE VARCHAR(50);

-- Recreate the view v_reservations_details
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
