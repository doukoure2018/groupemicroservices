-- =============================================================================
-- Rebrand SIRA Guinée : email du SUPER_ADMIN technique eureka-manager
-- =============================================================================
-- V10 a créé l'utilisateur eureka-manager@guidipress-io.com (mot de passe
-- manager2711). On garde la même identité fonctionnelle, on rebrand
-- uniquement l'email. Pas d'impact sur le mot de passe ni les rôles.
--
-- Idempotent : si aucun user avec l'email Guidipress (cas où V10 n'a jamais
-- tourné), 0 ligne mise à jour, OK.
-- =============================================================================

UPDATE users
SET email = 'eureka-manager@sira-guinee.com'
WHERE email = 'eureka-manager@guidipress-io.com';
