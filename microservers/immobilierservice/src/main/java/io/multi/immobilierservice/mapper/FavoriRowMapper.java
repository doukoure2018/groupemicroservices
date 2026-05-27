package io.multi.immobilierservice.mapper;

import io.multi.immobilierservice.domain.Favori;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;

@Component
public class FavoriRowMapper implements RowMapper<Favori> {

    @Override
    public Favori mapRow(ResultSet rs, int rowNum) throws SQLException {
        return Favori.builder()
                .favoriId(rs.getLong("favori_id"))
                .userId(rs.getLong("user_id"))
                .proprieteId(rs.getLong("propriete_id"))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .build();
    }
}
