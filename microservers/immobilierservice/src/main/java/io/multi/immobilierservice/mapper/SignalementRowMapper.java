package io.multi.immobilierservice.mapper;

import io.multi.immobilierservice.domain.Signalement;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;

@Component
public class SignalementRowMapper implements RowMapper<Signalement> {

    @Override
    public Signalement mapRow(ResultSet rs, int rowNum) throws SQLException {
        return Signalement.builder()
                .signalementId(rs.getLong("signalement_id"))
                .signalementUuid(rs.getString("signalement_uuid"))
                .userId(rs.getLong("user_id"))
                .proprieteId(rs.getLong("propriete_id"))
                .motif(rs.getString("motif"))
                .description(rs.getString("description"))
                .statut(rs.getString("statut"))
                .traitePar(rs.getObject("traite_par", Long.class))
                .dateTraitement(rs.getObject("date_traitement", OffsetDateTime.class))
                .notesAdmin(rs.getString("notes_admin"))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .build();
    }
}
