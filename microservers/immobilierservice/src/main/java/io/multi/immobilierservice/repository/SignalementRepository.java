package io.multi.immobilierservice.repository;

import io.multi.immobilierservice.domain.Signalement;

import java.util.List;
import java.util.Optional;

public interface SignalementRepository {

    Signalement save(Signalement signalement);

    Optional<Signalement> findByUuid(String signalementUuid);

    List<Signalement> findForAdmin(String statut, int limit, int offset);
    long countForAdmin(String statut);

    /** Nombre de signalements DISTINCTS (par user) EN_ATTENTE sur une propriété. */
    int countDistinctUsersForPropriete(Long proprieteId);

    Optional<Signalement> traiter(String uuid, String statut, Long adminUserId, String notesAdmin);

    /** True si le user a déjà un signalement EN_ATTENTE sur la propriété (anti-doublon). */
    boolean existsSignalementOfUser(Long userId, Long proprieteId);
}
