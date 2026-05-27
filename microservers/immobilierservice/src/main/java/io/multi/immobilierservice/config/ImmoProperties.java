package io.multi.immobilierservice.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration métier immobilière chargée depuis {@code application.yml}
 * (préfixe {@code immo.}).
 *
 * <p>Centralise les limites par type de profil et les règles de modération
 * pour éviter les @Value dispersés.
 */
@Component
@ConfigurationProperties(prefix = "immo")
@Getter
@Setter
public class ImmoProperties {

    private Limites limites = new Limites();
    private Moderation moderation = new Moderation();
    private Expiration expiration = new Expiration();

    @Getter
    @Setter
    public static class Limites {
        /** Annonces actives max pour PROPRIETAIRE_SIMPLE (-1 = illimité). */
        private int proprietaireSimpleMax = 5;
        /** Annonces actives max pour DEMARCHEUR. */
        private int demarcheurMax = 100;
        /** Annonces actives max pour AGENT_AGENCE. */
        private int agentAgenceMax = -1;

        /** Renvoie la limite pour un type donné, ou {@code -1} (illimité) si inconnu. */
        public int forType(String typeProfil) {
            return switch (typeProfil) {
                case "PROPRIETAIRE_SIMPLE" -> proprietaireSimpleMax;
                case "DEMARCHEUR"          -> demarcheurMax;
                case "AGENT_AGENCE"        -> agentAgenceMax;
                default                    -> -1;
            };
        }
    }

    @Getter
    @Setter
    public static class Moderation {
        /** Auto-publier si {@code statutVerification = VERIFIE}, sinon EN_ATTENTE_VALIDATION. */
        private boolean autoPublishSiVerifie = true;
        /** Forcer EN_ATTENTE_VALIDATION pour la toute première annonce (anti-spam). */
        private boolean premiereAnnonceToujoursValidation = true;
    }

    @Getter
    @Setter
    public static class Expiration {
        /** Durée de vie d'une annonce publiée (en jours) avant passage auto en RETIRE. */
        private int dureeJours = 60;
        /** Nb jours avant date_expiration où on envoie le rappel J-X. */
        private int rappelJoursAvant = 7;
        /** Cron du job d'expiration (chargé sur le @Scheduled via SpEL). */
        private String jobCron = "0 0 2 * * *";
        /** Fuseau horaire pour interpréter le cron. Africa/Conakry pour le marché cible. */
        private String jobTz = "Africa/Conakry";
    }
}
