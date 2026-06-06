package io.multi.immobilierservice.mapper;

import io.multi.immobilierservice.domain.AdminAction;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;

@Component
public class AdminActionRowMapper implements RowMapper<AdminAction> {

    @Override
    public AdminAction mapRow(ResultSet rs, int rowNum) throws SQLException {
        return AdminAction.builder()
                .actionId(rs.getLong("action_id"))
                .actionUuid(rs.getString("action_uuid"))
                .adminUserId(rs.getLong("admin_user_id"))
                .proprieteUuid(rs.getString("propriete_uuid"))
                .action(rs.getString("action"))
                .motif(rs.getString("motif"))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .build();
    }
}
