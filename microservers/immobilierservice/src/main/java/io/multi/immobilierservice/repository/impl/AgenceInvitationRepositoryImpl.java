package io.multi.immobilierservice.repository.impl;

import io.multi.immobilierservice.domain.AgenceInvitation;
import io.multi.immobilierservice.mapper.AgenceInvitationRowMapper;
import io.multi.immobilierservice.query.AgenceInvitationQuery;
import io.multi.immobilierservice.repository.AgenceInvitationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class AgenceInvitationRepositoryImpl implements AgenceInvitationRepository {

    private final JdbcClient jdbcClient;
    private final AgenceInvitationRowMapper rowMapper;

    @Override
    public AgenceInvitation save(Long agenceId, Long inviteUserId, Long inviteParUserId,
                                  String token, String bioProposee, String telephonePropose,
                                  OffsetDateTime dateExpiration) {
        return jdbcClient.sql(AgenceInvitationQuery.INSERT_INVITATION)
                .param("token", token)
                .param("agenceId", agenceId)
                .param("inviteUserId", inviteUserId)
                .param("inviteParUserId", inviteParUserId)
                .param("bioProposee", bioProposee)
                .param("telephonePropose", telephonePropose)
                .param("dateExpiration", dateExpiration)
                .query(rowMapper)
                .single();
    }

    @Override
    public Optional<AgenceInvitation> findByToken(String token) {
        return jdbcClient.sql(AgenceInvitationQuery.FIND_BY_TOKEN)
                .param("token", token)
                .query(rowMapper)
                .optional();
    }

    @Override
    public Optional<AgenceInvitation> findByUuid(String invitationUuid) {
        return jdbcClient.sql(AgenceInvitationQuery.FIND_BY_UUID)
                .param("invitationUuid", invitationUuid)
                .query(rowMapper)
                .optional();
    }

    @Override
    public Optional<AgenceInvitation> findActiveByAgenceAndUser(Long agenceId, Long inviteUserId) {
        return jdbcClient.sql(AgenceInvitationQuery.FIND_ACTIVE_BY_AGENCE_USER)
                .param("agenceId", agenceId)
                .param("inviteUserId", inviteUserId)
                .query(rowMapper)
                .optional();
    }

    @Override
    public List<AgenceInvitation> findPendingForUser(Long userId) {
        return jdbcClient.sql(AgenceInvitationQuery.FIND_PENDING_FOR_USER)
                .param("userId", userId)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<AgenceInvitation> findForAgence(Long agenceId) {
        return jdbcClient.sql(AgenceInvitationQuery.FIND_FOR_AGENCE)
                .param("agenceId", agenceId)
                .query(rowMapper)
                .list();
    }

    @Override
    public Optional<AgenceInvitation> updateStatut(Long invitationId, String statut, String motifRefus) {
        return jdbcClient.sql(AgenceInvitationQuery.UPDATE_STATUT)
                .param("invitationId", invitationId)
                .param("statut", statut)
                .param("motifRefus", motifRefus)
                .query(rowMapper)
                .optional();
    }
}
