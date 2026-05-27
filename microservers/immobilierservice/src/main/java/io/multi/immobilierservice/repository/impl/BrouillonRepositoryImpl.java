package io.multi.immobilierservice.repository.impl;

import io.multi.immobilierservice.domain.Brouillon;
import io.multi.immobilierservice.mapper.BrouillonRowMapper;
import io.multi.immobilierservice.query.BrouillonQuery;
import io.multi.immobilierservice.repository.BrouillonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class BrouillonRepositoryImpl implements BrouillonRepository {

    private final JdbcClient jdbcClient;
    private final BrouillonRowMapper rowMapper;

    @Override
    public Brouillon save(Long userId, String donneesJson, int etapeActuelle) {
        return jdbcClient.sql(BrouillonQuery.INSERT_BROUILLON)
                .param("userId", userId)
                .param("donneesJson", donneesJson)
                .param("etapeActuelle", etapeActuelle)
                .query(rowMapper)
                .single();
    }

    @Override
    public Optional<Brouillon> update(String brouillonUuid, String donneesJson, int etapeActuelle) {
        return jdbcClient.sql(BrouillonQuery.UPDATE_BROUILLON)
                .param("brouillonUuid", brouillonUuid)
                .param("donneesJson", donneesJson)
                .param("etapeActuelle", etapeActuelle)
                .query(rowMapper)
                .optional();
    }

    @Override
    public Optional<Brouillon> findByUuid(String brouillonUuid) {
        return jdbcClient.sql(BrouillonQuery.FIND_BY_UUID)
                .param("brouillonUuid", brouillonUuid)
                .query(rowMapper)
                .optional();
    }

    @Override
    public List<Brouillon> findByUser(Long userId) {
        return jdbcClient.sql(BrouillonQuery.FIND_BY_USER)
                .param("userId", userId)
                .query(rowMapper)
                .list();
    }

    @Override
    public void deleteByUuid(String brouillonUuid) {
        jdbcClient.sql(BrouillonQuery.DELETE_BY_UUID)
                .param("brouillonUuid", brouillonUuid)
                .update();
    }

    @Override
    public void linkPropriete(String brouillonUuid, Long proprieteId) {
        jdbcClient.sql(BrouillonQuery.LINK_PROPRIETE)
                .param("brouillonUuid", brouillonUuid)
                .param("proprieteId", proprieteId)
                .update();
    }
}
