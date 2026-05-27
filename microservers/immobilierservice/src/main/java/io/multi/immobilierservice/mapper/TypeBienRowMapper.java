package io.multi.immobilierservice.mapper;

import io.multi.immobilierservice.domain.TypeBien;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;

@Component
public class TypeBienRowMapper implements RowMapper<TypeBien> {

    @Override
    public TypeBien mapRow(ResultSet rs, int rowNum) throws SQLException {
        return TypeBien.builder()
                .typeBienId(rs.getLong("type_bien_id"))
                .typeBienUuid(rs.getString("type_bien_uuid"))
                .code(rs.getString("code"))
                .libelle(rs.getString("libelle"))
                .description(rs.getString("description"))
                .icone(rs.getString("icone"))
                .ordreAffichage(rs.getInt("ordre_affichage"))
                .actif(rs.getBoolean("actif"))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
                .build();
    }
}
