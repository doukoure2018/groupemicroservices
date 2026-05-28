package io.multi.immobilierservice.service;

import io.multi.immobilierservice.domain.Signalement;
import io.multi.immobilierservice.dto.SignalementCreateRequest;

import java.util.List;

public interface SignalementService {

    /**
     * Crée un signalement. Vérifie qu'aucun signalement EN_ATTENTE du même user
     * n'existe déjà sur cette propriété (anti-doublon). Émet une alerte log
     * (TODO Phase 11 : Kafka) si la propriété atteint le seuil de 3 signalements
     * distincts — purement informatif pour l'admin, pas de bascule auto.
     */
    Signalement creer(String proprieteUuid, SignalementCreateRequest req, Long userId);

    /** Admin : liste des signalements (par défaut EN_ATTENTE), triés par nb distinct DESC. */
    List<Signalement> findForAdmin(String statut, int limit, int offset);
    long countForAdmin(String statut);

    /**
     * Admin : décision sur un signalement.
     * <ul>
     *   <li>{@code RETIRE} → signalement TRAITE + propriété passe en RETIRE</li>
     *   <li>{@code REJETE} → signalement REJETE (jugé infondé)</li>
     *   <li>{@code LAISSE} → signalement TRAITE sans action sur la propriété</li>
     * </ul>
     */
    Signalement traiter(String signalementUuid, String action, String notesAdmin, Long adminUserId);
}
