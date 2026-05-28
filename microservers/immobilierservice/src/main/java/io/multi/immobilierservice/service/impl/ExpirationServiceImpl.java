package io.multi.immobilierservice.service.impl;

import io.multi.immobilierservice.config.ImmoProperties;
import io.multi.immobilierservice.domain.ProfilImmo;
import io.multi.immobilierservice.domain.Propriete;
import io.multi.immobilierservice.event.EventType;
import io.multi.immobilierservice.repository.ProfilImmoRepository;
import io.multi.immobilierservice.repository.ProprieteRepository;
import io.multi.immobilierservice.repository.UserLookupRepository;
import io.multi.immobilierservice.service.ExpirationService;
import io.multi.immobilierservice.service.ImmoNotificationProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpirationServiceImpl implements ExpirationService {

    private final ProprieteRepository proprieteRepository;
    private final ImmoProperties immoProperties;
    private final ProfilImmoRepository profilImmoRepository;
    private final UserLookupRepository userLookupRepository;
    private final ImmoNotificationProducer notificationProducer;

    /**
     * Tâche planifiée. La valeur du cron et son fuseau viennent de {@link ImmoProperties} :
     * <pre>
     *   immo:
     *     expiration:
     *       job-cron: "0 0 2 * * *"
     *       job-tz: "Africa/Conakry"
     * </pre>
     */
    @Scheduled(cron = "${immo.expiration.job-cron:0 0 2 * * *}",
               zone = "${immo.expiration.job-tz:Africa/Conakry}")
    public void runScheduled() {
        log.info("Job expiration : démarrage planifié ({})",
                immoProperties.getExpiration().getJobTz());
        Map<String, Integer> stats = executeJob();
        log.info("Job expiration : terminé — rappels={} retires={}",
                stats.get("rappels"), stats.get("retires"));
    }

    @Override
    public Map<String, Integer> executeJob() {
        int joursAvant = immoProperties.getExpiration().getRappelJoursAvant();

        // 1. Marquer rappels — atomique, idempotent grâce au UPDATE + RETURNING
        //    (rappel_expiration_envoye_at est posé en BD avant tout publish Kafka).
        //    DOUBLE BARRIÈRE D'IDEMPOTENCE : ce flag (Phase 9b) + immo_notification_emise
        //    (Phase 11). Si un rejeu se produit, ni la BD ni Kafka ne reverront
        //    deux fois la même notification.
        List<Propriete> rappels = proprieteRepository.markRappelExpirationAndReturn(joursAvant);
        for (Propriete p : rappels) {
            log.info("[RAPPEL J-{}] propriete {} expire le {} (titre: {})",
                    joursAvant, p.getReference(), p.getDateExpiration(), p.getTitre());
            publishRappelExpiration(p, joursAvant);
        }

        // 2. Expirer les dépassées — atomique. Pas de notification email aujourd'hui
        //    (décision : on prévient AVANT à J-7, pas après que l'annonce soit retirée).
        List<Propriete> retires = proprieteRepository.expireOutdatedAndReturn();
        for (Propriete p : retires) {
            log.info("[EXPIREE] propriete {} passée à RETIRE (titre: {})",
                    p.getReference(), p.getTitre());
        }

        return Map.of("rappels", rappels.size(), "retires", retires.size());
    }

    /**
     * Publie IMMO_RAPPEL_EXPIRATION. La ref Kafka est {@code IMMO_RAPPEL_EXPIRATION:{uuid}} :
     * si jamais le rappel-flag a été reset manuellement après notif (cas rare admin),
     * on évite quand même de re-spammer le vendeur grâce à immo_notification_emise.
     */
    private void publishRappelExpiration(Propriete p, int joursAvant) {
        try {
            ProfilImmo profil = profilImmoRepository.findById(p.getProfilId()).orElse(null);
            if (profil == null) return;
            // Lookup SQL local (pas Feign) car le job peut tourner sans JWT contextuel.
            var vendeur = userLookupRepository.findById(profil.getUserId()).orElse(null);
            if (vendeur == null || vendeur.email() == null) {
                log.warn("RAPPEL_EXPIRATION skip pour {} : vendeur sans email", p.getReference());
                return;
            }
            long joursRestants = p.getDateExpiration() != null
                    ? ChronoUnit.DAYS.between(LocalDate.now(), p.getDateExpiration().toLocalDate())
                    : joursAvant;
            Map<String, Object> data = new HashMap<>();
            data.put("vendeurEmail", vendeur.email());
            data.put("vendeurNom", vendeur.nomComplet());
            data.put("proprieteUuid", p.getProprieteUuid());
            data.put("proprieteReference", p.getReference());
            data.put("proprieteTitre", p.getTitre());
            data.put("joursRestants", String.valueOf(Math.max(0, joursRestants)));
            data.put("dateExpiration", p.getDateExpiration() != null
                    ? p.getDateExpiration().toLocalDate().toString() : "");

            notificationProducer.publish(
                    EventType.IMMO_RAPPEL_EXPIRATION,
                    EventType.IMMO_RAPPEL_EXPIRATION.name() + ":" + p.getProprieteUuid(),
                    data);
        } catch (Exception e) {
            log.error("Échec publish RAPPEL_EXPIRATION pour {} : {}", p.getReference(), e.getMessage());
        }
    }
}
