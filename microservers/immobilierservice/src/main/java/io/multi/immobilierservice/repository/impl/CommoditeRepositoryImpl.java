package io.multi.immobilierservice.repository.impl;

import io.multi.immobilierservice.domain.Commodite;
import io.multi.immobilierservice.mapper.CommoditeRowMapper;
import io.multi.immobilierservice.query.CommoditeQuery;
import io.multi.immobilierservice.repository.CommoditeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class CommoditeRepositoryImpl implements CommoditeRepository {

    private final JdbcClient jdbcClient;
    private final CommoditeRowMapper rowMapper;

    @Override
    public List<Commodite> findAll() {
        return jdbcClient.sql(CommoditeQuery.FIND_ALL).query(rowMapper).list();
    }

    @Override
    public Optional<Commodite> findByCode(String code) {
        return jdbcClient.sql(CommoditeQuery.FIND_BY_CODE)
                .param("code", code)
                .query(rowMapper)
                .optional();
    }

    @Override
    public List<Commodite> findByCodes(List<String> codes) {
        if (codes == null || codes.isEmpty()) return List.of();
        return jdbcClient.sql(CommoditeQuery.FIND_BY_CODES)
                .param("codes", codes.toArray(new String[0]))
                .query(rowMapper)
                .list();
    }
}
