package io.multi.immobilierservice.repository;

import io.multi.immobilierservice.domain.AgenceInvitation;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface AgenceInvitationRepository {

    AgenceInvitation save(Long agenceId, Long inviteUserId, Long inviteParUserId,
                          String token, String bioProposee, String telephonePropose,
                          OffsetDateTime dateExpiration);

    Optional<AgenceInvitation> findByToken(String token);

    Optional<AgenceInvitation> findByUuid(String invitationUuid);

    Optional<AgenceInvitation> findActiveByAgenceAndUser(Long agenceId, Long inviteUserId);

    List<AgenceInvitation> findPendingForUser(Long userId);

    List<AgenceInvitation> findForAgence(Long agenceId);

    Optional<AgenceInvitation> updateStatut(Long invitationId, String statut, String motifRefus);
}
