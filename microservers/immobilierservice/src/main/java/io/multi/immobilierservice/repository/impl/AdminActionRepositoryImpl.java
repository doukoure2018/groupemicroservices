package io.multi.immobilierservice.repository.impl;

import io.multi.immobilierservice.domain.AdminAction;
import io.multi.immobilierservice.mapper.AdminActionRowMapper;
import io.multi.immobilierservice.query.AdminActionQuery;
import io.multi.immobilierservice.repository.AdminActionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class AdminActionRepositoryImpl implements AdminActionRepository {

    private final JdbcClient jdbcClient;
    private final AdminActionRowMapper rowMapper;

    @Override
    public AdminAction save(AdminAction action) {
        return jdbcClient.sql(AdminActionQuery.INSERT_ADMIN_ACTION)
                .param("adminUserId", action.getAdminUserId())
                .param("proprieteUuid", action.getProprieteUuid())
                .param("action", action.getAction())
                .param("motif", action.getMotif())
                .query(rowMapper)
                .single();
    }
}
