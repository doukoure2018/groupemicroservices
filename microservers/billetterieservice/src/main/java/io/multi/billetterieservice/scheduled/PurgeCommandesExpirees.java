package io.multi.billetterieservice.scheduled;

import io.multi.billetterieservice.query.CommandeQuery;
import io.multi.billetterieservice.service.CommandeService;
import io.multi.billetterieservice.service.paiement.PrestatairePaiement;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Libère les places immobilisées par une commande dont le paiement n'a jamais
 * abouti. Sans cette purge, un client qui ferme l'onglet du prestataire garde
 * ses sièges indéfiniment et le départ finit par afficher complet à tort.
 *
 * <p>Avant d'abandonner une commande, on redemande son sort au prestataire :
 * une notification perdue est plus fréquente qu'un paiement réellement
 * abandonné, et annuler une commande payée serait la pire des deux erreurs.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PurgeCommandesExpirees {

    private final JdbcClient jdbcClient;

    /**
     * Injecté par l'interface, donc à travers le proxy transactionnel : chaque
     * commande est traitée dans sa propre transaction et un échec isolé ne
     * défait pas le travail déjà fait sur les précédentes.
     */
    private final CommandeService commandeService;

    /** Sert à savoir si quelqu'un peut encore se prononcer sur un règlement. */
    private final List<PrestatairePaiement> prestataires;

    /** Durée de vie d'une commande en attente de paiement. Défaut 30 minutes. */
    @Value("${paiement.delai-expiration-minutes:30}")
    private int delaiExpirationMinutes;

    /**
     * Au-delà de ce délai la commande est abandonnée même sans réponse du
     * prestataire. Une panne prolongée chez lui ne doit pas finir par geler
     * tout un départ. Défaut 24 heures.
     */
    @Value("${paiement.delai-abandon-minutes:1440}")
    private int delaiAbandonMinutes;

    @Scheduled(fixedRateString = "${paiement.purge-intervalle-ms:300000}",
               initialDelayString = "${paiement.purge-delai-initial-ms:60000}")
    public void purgerCommandesEnAttente() {
        List<Object[]> expirees = jdbcClient.sql(CommandeQuery.FIND_COMMANDES_EN_ATTENTE_EXPIREES)
                .param("minutes", delaiExpirationMinutes)
                .param("minutesAbandon", delaiAbandonMinutes)
                .query((rs, rowNum) -> new Object[]{
                        rs.getString("commande_uuid"),
                        rs.getString("reference_paiement"),
                        rs.getString("mode_code"),
                        rs.getBoolean("abandon_force")
                })
                .list();

        if (expirees.isEmpty()) {
            return;
        }

        log.info("Purge : {} commande(s) en attente depuis plus de {} minutes", expirees.size(), delaiExpirationMinutes);

        int rattrapees = 0;
        int abandonnees = 0;
        int reportees = 0;
        for (Object[] ligne : expirees) {
            String commandeUuid = (String) ligne[0];
            String reference = (String) ligne[1];
            String modeCode = (String) ligne[2];
            boolean abandonForce = (Boolean) ligne[3];

            boolean verifiable = reference != null && !reference.isBlank()
                    && modeCode != null
                    && prestataires.stream().anyMatch(p -> p.supporte(modeCode));
            try {
                if (verifiable) {
                    // Rattrape l'encaissement dont la notification s'est perdue.
                    // Idempotent, et sans effet si le prestataire répond encore
                    // « en attente ».
                    var commande = commandeService.confirmerPaiement(reference);
                    if (!"EN_ATTENTE".equals(commande.getStatut())) {
                        rattrapees++;
                        continue;
                    }
                }
                // Plus personne ne traite ce mode : la commande ne pourra jamais
                // être confirmée, inutile d'attendre davantage.
                commandeService.expirerCommande(commandeUuid);
                abandonnees++;
            } catch (Exception e) {
                if (abandonForce) {
                    log.warn("Commande {} abandonnée sans réponse du prestataire après {} minutes : {}",
                            commandeUuid, delaiAbandonMinutes, e.getMessage());
                    try {
                        commandeService.expirerCommande(commandeUuid);
                        abandonnees++;
                    } catch (Exception echec) {
                        reportees++;
                        log.error("Abandon impossible pour la commande {} : {}", commandeUuid, echec.getMessage());
                    }
                } else {
                    // Prestataire injoignable : on laisse la commande en attente,
                    // le passage suivant réessaiera.
                    reportees++;
                    log.warn("Purge reportée pour la commande {} : {}", commandeUuid, e.getMessage());
                }
            }
        }

        log.info("Purge terminée : {} rattrapée(s), {} abandonnée(s), {} reportée(s)", rattrapees, abandonnees, reportees);
    }
}
