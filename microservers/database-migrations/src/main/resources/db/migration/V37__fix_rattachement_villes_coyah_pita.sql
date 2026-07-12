-- V37 : corrige le rattachement régional de deux villes saisies à la main
-- avant le seed V36, en écart avec le découpage administratif officiel :
--   - Coyah  : région de Kindia (était rattachée à Conakry) ;
--   - Pita   : région de Mamou  (était rattachée à Labé).
-- Sans effet sur communes/sites (leurs FK pointent la ville, pas la région).

UPDATE villes v
SET region_id = r.region_id
FROM regions r
WHERE LOWER(r.libelle) = 'kindia'
  AND LOWER(v.libelle) = 'coyah'
  AND v.region_id <> r.region_id;

UPDATE villes v
SET region_id = r.region_id
FROM regions r
WHERE LOWER(r.libelle) = 'mamou'
  AND LOWER(v.libelle) = 'pita'
  AND v.region_id <> r.region_id;
