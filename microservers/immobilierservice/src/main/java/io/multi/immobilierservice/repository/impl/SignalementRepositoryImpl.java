package io.multi.immobilierservice.repository.impl;

import io.multi.immobilierservice.domain.Signalement;
import io.multi.immobilierservice.mapper.SignalementRowMapper;
import io.multi.immobilierservice.query.SignalementQuery;
import io.multi.immobilierservice.repository.SignalementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class SignalementRepositoryImpl implements SignalementRepository {

    private final JdbcClient jdbcClient;
    private final SignalementRowMapper rowMapper;

    @Override
    public Signalement save(Signalement s) {
        return jdbcClient.sql(SignalementQuery.INSERT_SIGNALEMENT)
                .param("userId", s.getUserId())
                .param("proprieteId", s.getProprieteId())
                .param("motif", s.getMotif())
                .param("description", s.getDescription())
                .query(rowMapper).single();
    }

    @Override
    public Optional<Signalement> findByUuid(String uuid) {
        return jdbcClient.sql(SignalementQuery.FIND_BY_UUID)
                .param("signalementUuid", uuid).query(rowMapper).optional();
    }

    @Override
    public List<Signalement> findForAdmin(String statut, int limit, int offset) {
        return jdbcClient.sql(SignalementQuery.FIND_FOR_ADMIN_BY_PROPRIETE)
                .param("statut", statut).param("limit", limit).param("offset", offset)
                .query(rowMapper).list();
    }

    @Override
    public long countForAdmin(String statut) {
        return jdbcClient.sql(SignalementQuery.COUNT_FOR_ADMIN)
                .param("statut", statut).query(Long.class).single();
    }

    @Override
    public int countDistinctUsersForPropriete(Long proprieteId) {
        return jdbcClient.sql(SignalementQuery.COUNT_DISTINCT_USERS_FOR_PROPRIETE)
                .param("proprieteId", proprieteId).query(Integer.class).single();
    }

    @Override
    public Optional<Signalement> traiter(String uuid, String statut, Long adminUserId, String notesAdmin) {
        return jdbcClient.sql(SignalementQuery.UPDATE_TRAITE)
                .param("signalementUuid", uuid)
                .param("statut", statut)
                .param("adminUserId", adminUserId)
                .param("notesAdmin", notesAdmin)
                .query(rowMapper).optional();
    }

    @Override
    public boolean existsSignalementOfUser(Long userId, Long proprieteId) {
        return jdbcClient.sql(SignalementQuery.EXISTS_SIGNALEMENT_OF_USER)
                .param("userId", userId).param("proprieteId", proprieteId)
                .query(Boolean.class).single();
    }
}
