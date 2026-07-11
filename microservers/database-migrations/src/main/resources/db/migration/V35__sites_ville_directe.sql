-- V35 : dénormalisation de la ville sur les sites (refactoring parcours transport, dette T12a).
--
-- Problème réglé : la ville d'un site était reconstituée par la chaîne
-- localisations → quartiers → communes → villes, conditionnée par
-- localisations.quartier_id NULLABLE. Une localisation sans quartier rendait
-- son site invisible dans toutes les recherches par ville (web + mobile).
--
-- Migration strictement additive : aucune colonne renommée/supprimée, aucune
-- vue touchée. Les requêtes applicatives passent en
-- COALESCE(ville directe, ville dérivée par la chaîne).

-- 1. Colonne ville directe (nullable pour l'existant ; l'API la rend
--    obligatoire à la création des nouveaux sites)
ALTER TABLE sites
    ADD COLUMN IF NOT EXISTS ville_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_sites_ville'
    ) THEN
        ALTER TABLE sites
            ADD CONSTRAINT fk_sites_ville
            FOREIGN KEY (ville_id) REFERENCES villes (ville_id) ON DELETE RESTRICT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sites_ville_id ON sites (ville_id);

-- 2. Backfill : renseigner la ville des sites existants via la chaîne actuelle
--    (les sites dont la localisation n'a pas de quartier restent à NULL :
--    ils étaient déjà invisibles dans les recherches par ville ; à corriger
--    à la main en leur affectant une ville via l'écran Sites/Gares)
UPDATE sites s
SET ville_id = v.ville_id
FROM localisations l
JOIN quartiers q ON l.quartier_id = q.quartier_id
JOIN communes c ON q.commune_id = c.commune_id
JOIN villes v ON c.ville_id = v.ville_id
WHERE s.localisation_id = l.localisation_id
  AND s.ville_id IS NULL;
