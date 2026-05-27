package io.multi.immobilierservice.service;

import java.util.Map;

/**
 * Job quotidien d'expiration des annonces immobilières (Phase 9b).
 *
 * <p>Exécute deux opérations atomiques :
 * <ol>
 *   <li>Marquer le rappel J-X pour les annonces qui expirent bientôt (idempotent
 *       via UPDATE + RETURNING : une seule instance/run gagne la ligne).</li>
 *   <li>Passer en RETIRE les annonces dont {@code date_expiration} est dépassée.</li>
 * </ol>
 *
 * <p>L'envoi effectif des notifications Kafka arrive en Phase 11. Ici on log
 * + on marque la colonne d'idempotence.
 */
public interface ExpirationService {

    /**
     * Exécute le job. Idempotent — peut être appelé en // par plusieurs instances :
     * le UPDATE atomique garantit qu'une ligne donnée n'est traitée qu'une fois.
     *
     * @return statistiques {@code {rappels: N, retires: M}}
     */
    Map<String, Integer> executeJob();
}
