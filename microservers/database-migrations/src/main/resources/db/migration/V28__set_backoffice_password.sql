-- V28 : Pose le mot de passe DEFINITIF du compte back-office (douklifsa93@gmail.com).
-- Remplace le hash TEMPORAIRE hardcodé de V27 (présent en clair dans le repo, donc
-- à considérer comme compromis) par un hash bcrypt choisi hors-repo par l'admin.
-- Idempotent : ciblé par email, rejoue sans effet de bord.
-- N'affecte PAS le cas TEST (compte Google réel) si on ne veut écraser que PROD :
-- ce UPDATE écrase le password QUEL QUE SOIT l'environnement où douklifsa93 existe.
UPDATE credentials
SET password = '$2a$12$jX2BFqQV2lWAlsRQBBXIqedqOrm4qUtLo/3E2oHcueeOI1E8F0ZrC'
WHERE user_id = (SELECT user_id FROM users WHERE email = 'douklifsa93@gmail.com');
