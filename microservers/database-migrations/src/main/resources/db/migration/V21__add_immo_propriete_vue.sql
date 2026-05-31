-- =============================================================================
-- V21 — Dédoublonnage des vues de propriété par user × jour calendaire
-- =============================================================================
-- Avant : `nombre_vues` incrémenté par UPDATE direct à chaque GET /immo/
-- proprietes/{uuid}. Un user qui rafraîchit la fiche 50 fois dans la journée
-- gonflait artificiellement le compteur. Bots/crawlers permitAll comptaient
-- aussi. → signal faux pour le vendeur.
--
-- Après : tentative INSERT-ON-CONFLICT-DO-NOTHING sur cette table à chaque
-- consultation par un user authentifié. UNIQUE(propriete_id, user_id,
-- vue_date) garantit qu'une 2e tentative dans la même journée est rejetée
-- silencieusement (rowsAffected=0). Le service Java n'incrémente
-- `immo_propriete.nombre_vues` QUE si l'INSERT a réussi (rowsAffected=1).
--
-- Comportement anonyme (sans JWT) : skip total — pas d'INSERT, pas d'UPDATE.
-- user_id NOT NULL côté schéma → impossible d'avoir une vue anonyme persistée.
-- Décision Phase Dédup : le vendeur veut un signal "vrais prospects
-- authentifiés", pas "bots Google + refresh maladif". Voir la doc inline du
-- service Java pour la justification complète.
--
-- Granularité DATE (pas TIMESTAMP) : 1 vue / user / jour calendaire. Une
-- consultation à 23h59 puis 00h01 = 2 vues (jours différents). Acceptable
-- pour le besoin business immo (pas un site média à compteurs minute).
--
-- Pas de backfill : `nombre_vues` actuel est gardé tel quel (héritage de
-- l'ancienne logique). Le compteur reprend simplement sa croissance dédupée
-- à partir de la migration. Pas de remise à zéro non plus.
--
-- Cleanup : DELETE en cascade depuis immo_propriete ON DELETE CASCADE — si
-- une propriété est supprimée, ses vues le sont aussi. Idem si un user est
-- supprimé (ON DELETE CASCADE sur users.user_id).
-- =============================================================================

CREATE TABLE IF NOT EXISTS immo_propriete_vue (
    propriete_vue_id BIGSERIAL PRIMARY KEY,
    propriete_id     BIGINT NOT NULL REFERENCES immo_propriete(propriete_id) ON DELETE CASCADE,
    user_id          BIGINT NOT NULL REFERENCES users(user_id)            ON DELETE CASCADE,
    vue_date         DATE   NOT NULL DEFAULT CURRENT_DATE,
    created_at       TIMESTAMP(6) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_immo_propriete_vue_user_jour
        UNIQUE (propriete_id, user_id, vue_date)
);

CREATE INDEX IF NOT EXISTS idx_immo_propriete_vue_propriete
    ON immo_propriete_vue(propriete_id);
CREATE INDEX IF NOT EXISTS idx_immo_propriete_vue_user
    ON immo_propriete_vue(user_id);

COMMENT ON TABLE immo_propriete_vue IS
    'Dédup vues : 1 user × 1 propriete × 1 jour calendaire. Anonyme ne compte pas (user_id NOT NULL). Voir V21 pour la justification.';
