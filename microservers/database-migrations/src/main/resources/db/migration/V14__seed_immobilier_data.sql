-- =============================================================================
-- V14 : Données de référence du module IMMOBILIER
-- =============================================================================
-- Types de biens et commodités (cf. maquettes mobile : 7 types + 9 commodités)
-- =============================================================================

-- 7 types de biens
INSERT INTO immo_type_bien (code, libelle, description, icone, ordre_affichage) VALUES
    ('MAISON',      'Maison',      'Maison individuelle',                          'home',          1),
    ('APPARTEMENT', 'Appartement', 'Logement dans un immeuble collectif',          'apartment',     2),
    ('IMMEUBLE',    'Immeuble',    'Bâtiment entier (immeuble de rapport)',        'business',      3),
    ('TERRAIN',     'Terrain',     'Terrain nu, constructible ou agricole',        'landscape',     4),
    ('BUREAU',      'Bureau',      'Espace professionnel à usage de bureau',       'work',          5),
    ('BOUTIQUE',    'Boutique',    'Local commercial / boutique',                  'store',         6),
    ('CHAMBRE',     'Chambre',     'Chambre individuelle (colocation, hôtel...)',  'bed',           7)
ON CONFLICT (code) DO NOTHING;

-- 9 commodités (issues des maquettes wizard étape 3)
INSERT INTO immo_commodite (code, libelle, categorie, icone, ordre_affichage) VALUES
    ('CLIMATISATION',     'Climatisation',     'CONFORT',   'ac_unit',           1),
    ('ASCENSEUR',         'Ascenseur',         'CONFORT',   'elevator',          2),
    ('GENERATEUR',        'Générateur',        'CONFORT',   'bolt',              3),
    ('PANNEAUX_SOLAIRES', 'Panneaux solaires', 'CONFORT',   'solar_power',       4),
    ('PARKING',           'Parking sur place', 'EXTERIEUR', 'local_parking',     5),
    ('CHAUFFE_EAU',       'Chauffe-eau',       'CONFORT',   'shower',            6),
    ('MEUBLE',            'Meublé',            'CONFORT',   'chair',             7),
    ('SECURITE_PRIVEE',   'Sécurité privée',   'SECURITE',  'security',          8),
    ('RESERVOIR_EAU',     'Réservoir d''eau',  'CONFORT',   'water_drop',        9)
ON CONFLICT (code) DO NOTHING;
