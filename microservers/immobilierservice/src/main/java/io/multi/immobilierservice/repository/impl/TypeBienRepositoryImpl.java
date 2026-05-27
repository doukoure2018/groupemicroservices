package io.multi.immobilierservice.repository.impl;

import io.multi.immobilierservice.domain.TypeBien;
import io.multi.immobilierservice.mapper.TypeBienRowMapper;
import io.multi.immobilierservice.query.TypeBienQuery;
import io.multi.immobilierservice.repository.TypeBienRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class TypeBienRepositoryImpl implements TypeBienRepository {

    private final JdbcClient jdbcClient;
    private final TypeBienRowMapper rowMapper;

    @Override
    public List<TypeBien> findAll() {
        return jdbcClient.sql(TypeBienQuery.FIND_ALL).query(rowMapper).list();
    }

    @Override
    public Optional<TypeBien> findByCode(String code) {
        return jdbcClient.sql(TypeBienQuery.FIND_BY_CODE)
                .param("code", code)
                .query(rowMapper)
                .optional();
    }
}
