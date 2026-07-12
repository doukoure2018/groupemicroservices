-- V36 : seed du référentiel géographique officiel de la Guinée.
--
-- Évite la saisie manuelle un à un (écrans Régions/Villes/Communes) :
--   - 8 régions administratives ;
--   - 34 villes : les 33 préfectures + Conakry (zone spéciale) ;
--   - communes : les 5 communes historiques de Conakry + la commune urbaine
--     homonyme de chaque préfecture.
-- Les quartiers ne sont pas seedés (des centaines, données locales mouvantes) :
-- ils se saisissent via l'écran Quartiers (saisie en lot) au fil des besoins.
--
-- Idempotent et sans doublon : chaque insertion vérifie l'existence par libellé
-- (insensible à la casse) — les données déjà saisies à la main sont conservées.

-- ============ 1. RÉGIONS ============
INSERT INTO regions (libelle, code, actif)
SELECT s.libelle, s.code, TRUE
FROM (VALUES
    ('Boké',      'BOK'),
    ('Conakry',   'CKY'),
    ('Faranah',   'FAR'),
    ('Kankan',    'KAN'),
    ('Kindia',    'KIN'),
    ('Labé',      'LAB'),
    ('Mamou',     'MAM'),
    ('Nzérékoré', 'NZE')
) AS s(libelle, code)
WHERE NOT EXISTS (
    SELECT 1 FROM regions r WHERE LOWER(r.libelle) = LOWER(s.libelle)
);

-- ============ 2. VILLES / PRÉFECTURES ============
-- Unicité vérifiée sur le libellé global (les noms de préfectures sont uniques
-- au niveau national), pour ne pas dupliquer les villes déjà saisies.
INSERT INTO villes (region_id, libelle, actif)
SELECT r.region_id, s.ville, TRUE
FROM (VALUES
    -- Région de Boké
    ('Boké', 'Boffa'), ('Boké', 'Boké'), ('Boké', 'Fria'),
    ('Boké', 'Gaoual'), ('Boké', 'Koundara'),
    -- Zone spéciale de Conakry
    ('Conakry', 'Conakry'),
    -- Région de Faranah
    ('Faranah', 'Dabola'), ('Faranah', 'Dinguiraye'),
    ('Faranah', 'Faranah'), ('Faranah', 'Kissidougou'),
    -- Région de Kankan
    ('Kankan', 'Kankan'), ('Kankan', 'Kérouané'), ('Kankan', 'Kouroussa'),
    ('Kankan', 'Mandiana'), ('Kankan', 'Siguiri'),
    -- Région de Kindia
    ('Kindia', 'Coyah'), ('Kindia', 'Dubréka'), ('Kindia', 'Forécariah'),
    ('Kindia', 'Kindia'), ('Kindia', 'Télimélé'),
    -- Région de Labé
    ('Labé', 'Koubia'), ('Labé', 'Labé'), ('Labé', 'Lélouma'),
    ('Labé', 'Mali'), ('Labé', 'Tougué'),
    -- Région de Mamou
    ('Mamou', 'Dalaba'), ('Mamou', 'Mamou'), ('Mamou', 'Pita'),
    -- Région de Nzérékoré
    ('Nzérékoré', 'Beyla'), ('Nzérékoré', 'Guéckédou'), ('Nzérékoré', 'Lola'),
    ('Nzérékoré', 'Macenta'), ('Nzérékoré', 'Nzérékoré'), ('Nzérékoré', 'Yomou')
) AS s(region, ville)
JOIN regions r ON LOWER(r.libelle) = LOWER(s.region)
WHERE NOT EXISTS (
    SELECT 1 FROM villes v WHERE LOWER(v.libelle) = LOWER(s.ville)
);

-- ============ 3. COMMUNES ============
-- 3a. Les 5 communes historiques de Conakry
INSERT INTO communes (ville_id, libelle, actif)
SELECT v.ville_id, s.commune, TRUE
FROM (VALUES
    ('Kaloum'), ('Dixinn'), ('Matam'), ('Ratoma'), ('Matoto')
) AS s(commune)
JOIN villes v ON LOWER(v.libelle) = 'conakry'
WHERE NOT EXISTS (
    SELECT 1 FROM communes c
    WHERE c.ville_id = v.ville_id AND LOWER(c.libelle) = LOWER(s.commune)
);

-- 3b. La commune urbaine homonyme de chaque préfecture (ex : préfecture de
--     Kindia → commune urbaine de Kindia). Les communes rurales se saisissent
--     via l'écran Communes (saisie en lot) selon les besoins.
INSERT INTO communes (ville_id, libelle, actif)
SELECT v.ville_id, v.libelle, TRUE
FROM villes v
WHERE LOWER(v.libelle) <> 'conakry'
  AND NOT EXISTS (
      SELECT 1 FROM communes c
      WHERE c.ville_id = v.ville_id AND LOWER(c.libelle) = LOWER(v.libelle)
  );
