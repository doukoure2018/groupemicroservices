package io.multi.immobilierservice.service.impl;

import io.multi.immobilierservice.config.ImmoProperties;
import io.multi.immobilierservice.domain.Propriete;
import io.multi.immobilierservice.repository.ProprieteRepository;
import io.multi.immobilierservice.service.ExpirationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpirationServiceImpl implements ExpirationService {

    private final ProprieteRepository proprieteRepository;
    private final ImmoProperties immoProperties;

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
        List<Propriete> rappels = proprieteRepository.markRappelExpirationAndReturn(joursAvant);
        for (Propriete p : rappels) {
            // TODO Phase 11 : publier Kafka EventType.PROPRIETE_EXPIRATION_PROCHE
            log.info("[RAPPEL J-{}] propriete {} expire le {} (titre: {})",
                    joursAvant, p.getReference(), p.getDateExpiration(), p.getTitre());
        }

        // 2. Expirer les dépassées — atomique
        List<Propriete> retires = proprieteRepository.expireOutdatedAndReturn();
        for (Propriete p : retires) {
            // TODO Phase 11 : publier Kafka EventType.PROPRIETE_EXPIREE
            log.info("[EXPIREE] propriete {} passée à RETIRE (titre: {})",
                    p.getReference(), p.getTitre());
        }

        return Map.of("rappels", rappels.size(), "retires", retires.size());
    }
}
