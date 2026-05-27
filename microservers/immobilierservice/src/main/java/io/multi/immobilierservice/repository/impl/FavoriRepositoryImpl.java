package io.multi.immobilierservice.repository.impl;

import io.multi.immobilierservice.domain.Favori;
import io.multi.immobilierservice.domain.Propriete;
import io.multi.immobilierservice.mapper.FavoriRowMapper;
import io.multi.immobilierservice.mapper.ProprieteRowMapper;
import io.multi.immobilierservice.query.FavoriQuery;
import io.multi.immobilierservice.repository.FavoriRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class FavoriRepositoryImpl implements FavoriRepository {

    private final JdbcClient jdbcClient;
    private final FavoriRowMapper favoriRowMapper;
    private final ProprieteRowMapper proprieteRowMapper;

    @Override
    public Optional<Favori> add(Long userId, Long proprieteId) {
        return jdbcClient.sql(FavoriQuery.INSERT_FAVORI)
                .param("userId", userId)
                .param("proprieteId", proprieteId)
                .query(favoriRowMapper)
                .optional();
    }

    @Override
    public boolean remove(Long userId, Long proprieteId) {
        int rows = jdbcClient.sql(FavoriQuery.DELETE_FAVORI)
                .param("userId", userId)
                .param("proprieteId", proprieteId)
                .update();
        return rows > 0;
    }

    @Override
    public boolean isFavorite(Long userId, Long proprieteId) {
        return jdbcClient.sql(FavoriQuery.CHECK_FAVORI)
                .param("userId", userId)
                .param("proprieteId", proprieteId)
                .query(Boolean.class)
                .single();
    }

    @Override
    public List<Propriete> findFavoriteProprietes(Long userId, int limit, int offset) {
        return jdbcClient.sql(FavoriQuery.FIND_FAVORIS_OF_USER)
                .param("userId", userId)
                .param("limit", limit)
                .param("offset", offset)
                .query(proprieteRowMapper)
                .list();
    }

    @Override
    public long countFavorisOfUser(Long userId) {
        return jdbcClient.sql(FavoriQuery.COUNT_FAVORIS_OF_USER)
                .param("userId", userId)
                .query(Long.class)
                .single();
    }

    @Override
    public Optional<Long> lookupProprieteIdByUuid(String proprieteUuid) {
        return jdbcClient.sql(FavoriQuery.LOOKUP_PROPRIETE_ID_BY_UUID)
                .param("proprieteUuid", proprieteUuid)
                .query(Long.class)
                .optional();
    }
}
